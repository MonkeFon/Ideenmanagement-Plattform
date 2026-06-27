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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class IdeaService {

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
                .title(req.title())
                .description(req.description())
                .category(req.category())
                .stage(Stage.SUBMITTED)
                .submittedAt(OffsetDateTime.now())
                .sponsorBoost(false)
                .campaignId(campaignId)
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
                i.getId(), i.getAuthorId(), authorName,
                title, description, i.getCategory(),
                i.getStage(), i.isSponsorBoost(), i.getPriorityScore(),
                net, store.listComments(i.getId()).size(), store.listEvaluations(i.getId()).size(),
                i.getSubmittedAt(), i.getCreatedAt(),
                campaignId, campaignName, campaignColor
        );
    }

    private String authorName(UUID authorId) {
        return store.findUserById(authorId).map(User::getDisplayName).orElse("Unknown");
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
