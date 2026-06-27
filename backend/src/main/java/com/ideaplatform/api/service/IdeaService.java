package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.*;
import com.ideaplatform.api.dto.IdeaDtos.*;
import com.ideaplatform.api.license.LicenseService;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class IdeaService {

    // Who may fill each assignment slot. Reviewers evaluate; idea managers/admins can
    // do both. Mirrors the @PreAuthorize on the evaluation + workflow endpoints.
    private static final Set<Role> REVIEWER_ROLES = EnumSet.of(Role.REVIEWER, Role.IDEA_MANAGER, Role.ADMIN);
    private static final Set<Role> MANAGER_ROLES  = EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN);
    // Who may (re)assign ideas to others.
    private static final Set<Role> CAN_ASSIGN     = EnumSet.of(Role.IDEA_MANAGER, Role.ADMIN, Role.SUPERADMIN);

    private final DataStore store;
    private final LicenseService licenses;
    private final EmbeddingService embeddings;
    private final ScoringService scoring;

    public IdeaService(DataStore store, LicenseService licenses,
                       EmbeddingService embeddings, ScoringService scoring) {
        this.store = store;
        this.licenses = licenses;
        this.embeddings = embeddings;
        this.scoring = scoring;
    }

    @Transactional
    public IdeaResponse create(CreateIdeaRequest req, AuthPrincipal me) {
        licenses.checkIdeaQuota(me.tenantId());
        UUID campaignId = resolveCampaign(req.campaignId(), me);
        Idea idea = Idea.builder()
                .tenantId(me.tenantId())
                .authorId(me.userId())
                .reference(nextReference(me.tenantId()))
                .title(req.title())
                .description(req.description())
                .category(req.category())
                .stage(Stage.SUBMITTED)
                .submittedAt(OffsetDateTime.now())
                .sponsorBoost(false)
                .campaignId(campaignId)
                // Optional, non-binding up-front suggestions. Validated against the
                // tenant + role so a submitter can't suggest someone who can't fill
                // the slot (or someone from another tenant).
                .preferredReviewerId(validateAssignee(req.preferredReviewerId(), REVIEWER_ROLES, me))
                .preferredManagerId(validateAssignee(req.preferredManagerId(), MANAGER_ROLES, me))
                .build();
        idea = store.saveIdea(idea);
        embeddings.indexIdeaSafe(idea);
        return toResponse(idea, authorName(idea.getAuthorId()));
    }

    @Transactional
    public IdeaResponse update(UUID id, UpdateIdeaRequest req, AuthPrincipal me) {
        Idea idea = mustOwn(id, me);
        if (me.role() == Role.EMPLOYEE) {
            throw new IllegalStateException("Eingereichte Ideen können von Mitarbeitenden nicht mehr bearbeitet werden");
        }
        if (req.title() != null) idea.setTitle(req.title());
        if (req.description() != null) idea.setDescription(req.description());
        if (req.category() != null) idea.setCategory(req.category());
        if (req.campaignId() != null) idea.setCampaignId(resolveCampaign(req.campaignId(), me));
        idea = store.saveIdea(idea);
        embeddings.indexIdeaSafe(idea);
        return toResponse(idea, authorName(idea.getAuthorId()));
    }

    /** Next per-tenant reference number (1-based, creation order). */
    private int nextReference(UUID tenantId) {
        return store.listIdeas(tenantId, null).stream()
                .map(Idea::getReference)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
    }

    /** Validates that the campaign belongs to the caller's tenant. */
    private UUID resolveCampaign(UUID campaignId, AuthPrincipal me) {
        if (campaignId == null) return null;
        return store.findCampaignByTenantAndId(me.tenantId(), campaignId)
                .map(Campaign::getId)
                .orElseThrow(() -> new EntityNotFoundException("Campaign " + campaignId));
    }

    public IdeaResponse get(UUID id, AuthPrincipal me) {
        Idea idea = mustSeeable(id, me);
        return toResponse(idea, authorName(idea.getAuthorId()));
    }

    public List<IdeaResponse> list(Stage stage, AuthPrincipal me) {
        List<Idea> all = store.listIdeas(me.tenantId(), stage);
        // Pre-resolve author names in one shot
        Map<UUID, String> authorNames = new HashMap<>();
        for (Idea i : all) {
            authorNames.computeIfAbsent(i.getAuthorId(),
                    aid -> store.findUserById(aid).map(User::getDisplayName).orElse("Unknown"));
        }
        return all.stream().map(i -> toResponse(i, authorNames.get(i.getAuthorId()))).toList();
    }

    public List<IdeaResponse> listByCampaign(UUID campaignId, AuthPrincipal me) {
        // Reused by CampaignService — kept here so the toResponse + author resolution
        // logic stays in one place.
        return store.listIdeas(me.tenantId(), null).stream()
                .filter(i -> campaignId.equals(i.getCampaignId()))
                .map(i -> toResponse(i, authorName(i.getAuthorId())))
                .toList();
    }

    @Transactional
    public IdeaResponse setSponsorBoost(UUID id, boolean boost, AuthPrincipal me) {
        if (me.role() != Role.SPONSOR && me.role() != Role.ADMIN) {
            throw new IllegalStateException("Only SPONSOR or ADMIN can toggle sponsor boost");
        }
        Idea idea = mustSeeable(id, me);
        idea.setSponsorBoost(boost);
        idea.setPriorityScore(scoring.computeFor(id, idea.getSubmittedAt(), boost));
        idea = store.saveIdea(idea);
        return toResponse(idea, authorName(idea.getAuthorId()));
    }

    // ── Assignment pipeline ──────────────────────────────────────────────────

    /** Users in the caller's tenant who can be picked as a reviewer or idea manager. */
    public List<AssignableUser> assignableUsers(AuthPrincipal me) {
        return store.listUsersForTenant(me.tenantId()).stream()
                .filter(User::isActive)
                .filter(u -> REVIEWER_ROLES.contains(u.getRole())) // superset of MANAGER_ROLES
                .sorted(java.util.Comparator
                        .comparing((User u) -> u.getRole().name())
                        .thenComparing(User::getDisplayName))
                .map(u -> new AssignableUser(u.getId(), u.getDisplayName(), u.getRole()))
                .toList();
    }

    /** Set or clear the binding reviewer/idea-manager assignment. Idea-manager/admin only. */
    @Transactional
    public IdeaResponse assign(UUID id, AssignmentRequest req, AuthPrincipal me) {
        if (!CAN_ASSIGN.contains(me.role())) {
            throw new IllegalStateException("Nur Ideenmanager oder Administratoren können Ideen zuweisen");
        }
        Idea idea = mustSeeable(id, me);
        idea.setAssignedReviewerId(validateAssignee(req.reviewerId(), REVIEWER_ROLES, me));
        idea.setAssignedManagerId(validateAssignee(req.managerId(), MANAGER_ROLES, me));
        idea = store.saveIdea(idea);
        return toResponse(idea, authorName(idea.getAuthorId()));
    }

    /**
     * The caller takes ownership of a slot themselves — used to accept a suggestion
     * from the task board. {@code as} is "reviewer" or "manager".
     */
    @Transactional
    public IdeaResponse claim(UUID id, String as, AuthPrincipal me) {
        Idea idea = mustSeeable(id, me);
        if ("reviewer".equalsIgnoreCase(as)) {
            if (!REVIEWER_ROLES.contains(me.role())) {
                throw new IllegalStateException("Diese Rolle kann keine Prüfungen übernehmen");
            }
            idea.setAssignedReviewerId(me.userId());
        } else if ("manager".equalsIgnoreCase(as)) {
            if (!MANAGER_ROLES.contains(me.role())) {
                throw new IllegalStateException("Diese Rolle kann keine Ideen managen");
            }
            idea.setAssignedManagerId(me.userId());
        } else {
            throw new IllegalArgumentException("Unbekannte Zuständigkeit: " + as);
        }
        idea = store.saveIdea(idea);
        return toResponse(idea, authorName(idea.getAuthorId()));
    }

    /**
     * The caller's task board: ideas assigned to them (as reviewer or idea manager),
     * plus ideas where they're the *suggested* assignee and the slot is still open
     * (the "accept this suggestion" queue).
     */
    public List<IdeaResponse> myTasks(AuthPrincipal me) {
        UUID uid = me.userId();
        List<Idea> mine = store.listIdeas(me.tenantId(), null).stream()
                .filter(i -> uid.equals(i.getAssignedReviewerId())
                          || uid.equals(i.getAssignedManagerId())
                          || (uid.equals(i.getPreferredReviewerId()) && i.getAssignedReviewerId() == null)
                          || (uid.equals(i.getPreferredManagerId())  && i.getAssignedManagerId() == null))
                .toList();
        Map<UUID, String> authorNames = new HashMap<>();
        for (Idea i : mine) {
            authorNames.computeIfAbsent(i.getAuthorId(),
                    aid -> store.findUserById(aid).map(User::getDisplayName).orElse("Unknown"));
        }
        return mine.stream().map(i -> toResponse(i, authorNames.get(i.getAuthorId()))).toList();
    }

    /**
     * Validates that an assignee (nullable) belongs to the caller's tenant and holds a
     * role eligible for the slot. Returns the id unchanged, or null if none given.
     */
    private UUID validateAssignee(UUID userId, Set<Role> eligible, AuthPrincipal me) {
        if (userId == null) return null;
        User u = store.findUserById(userId)
                .filter(x -> x.getTenantId().equals(me.tenantId()))
                .orElseThrow(() -> new EntityNotFoundException("User " + userId));
        if (!eligible.contains(u.getRole())) {
            throw new IllegalArgumentException(
                    u.getDisplayName() + " kann diese Zuständigkeit nicht übernehmen (Rolle " + u.getRole() + ")");
        }
        return userId;
    }

    public IdeaResponse toResponse(Idea i, String authorName) {
        int net = store.netVotes(i.getId());
        String title = i.getTitle();
        String description = i.getDescription();
        UUID campaignId = i.getCampaignId();
        String campaignName = null, campaignColor = null;
        if (campaignId != null) {
            Optional<Campaign> c = store.findCampaign(campaignId);
            if (c.isPresent()) {
                campaignName = c.get().getName();
                campaignColor = c.get().getColor();
            }
        }
        return new IdeaResponse(
                i.getId(), i.getReference(), i.getAuthorId(), authorName,
                title, description, i.getCategory(),
                i.getStage(), i.isSponsorBoost(), i.getPriorityScore(),
                net, store.listComments(i.getId()).size(), store.listEvaluations(i.getId()).size(),
                i.getSubmittedAt(), i.getCreatedAt(),
                campaignId, campaignName, campaignColor,
                i.getPreferredReviewerId(), userName(i.getPreferredReviewerId()),
                i.getPreferredManagerId(),  userName(i.getPreferredManagerId()),
                i.getAssignedReviewerId(),  userName(i.getAssignedReviewerId()),
                i.getAssignedManagerId(),   userName(i.getAssignedManagerId())
        );
    }

    private String authorName(UUID authorId) {
        return store.findUserById(authorId).map(User::getDisplayName).orElse("Unknown");
    }

    /** Display name for a user id, or null if the id is null / the user is gone. */
    private String userName(UUID id) {
        return id == null ? null : store.findUserById(id).map(User::getDisplayName).orElse(null);
    }

    private Idea mustOwn(UUID id, AuthPrincipal me) {
        Idea idea = mustSeeable(id, me);
        if (!idea.getAuthorId().equals(me.userId())
                && me.role() != Role.ADMIN && me.role() != Role.SUPERADMIN) {
            throw new IllegalStateException("Not owner of idea");
        }
        return idea;
    }

    private Idea mustSeeable(UUID id, AuthPrincipal me) {
        Idea idea = store.findIdea(id).orElseThrow(() -> new EntityNotFoundException("Idea " + id));
        if (!idea.getTenantId().equals(me.tenantId()) && me.role() != Role.SUPERADMIN) {
            throw new EntityNotFoundException("Idea " + id);
        }
        // Touch field to avoid lazy-loading surprises in caller
        @SuppressWarnings("unused") OffsetDateTime _t = idea.getCreatedAt();
        return idea;
    }
}
