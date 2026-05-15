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
        Idea idea = Idea.builder()
                .tenantId(me.tenantId())
                .authorId(me.userId())
                .title(req.title())
                .description(req.description())
                .category(req.category())
                .stage(Stage.DRAFT)
                .sponsorBoost(false)
                .build();
        idea = store.saveIdea(idea);
        embeddings.indexIdeaSafe(idea);
        return toResponse(idea, authorName(idea.getAuthorId()));
    }

    @Transactional
    public IdeaResponse update(UUID id, UpdateIdeaRequest req, AuthPrincipal me) {
        Idea idea = mustOwn(id, me);
        if (idea.getStage() != Stage.DRAFT && me.role() == Role.EMPLOYEE) {
            throw new IllegalStateException("Only DRAFT ideas can be edited by the author");
        }
        if (req.title() != null) idea.setTitle(req.title());
        if (req.description() != null) idea.setDescription(req.description());
        if (req.category() != null) idea.setCategory(req.category());
        idea = store.saveIdea(idea);
        embeddings.indexIdeaSafe(idea);
        return toResponse(idea, authorName(idea.getAuthorId()));
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
        return new IdeaResponse(
                i.getId(), i.getAuthorId(), authorName,
                i.getTitle(), i.getDescription(), i.getCategory(),
                i.getStage(), i.isSponsorBoost(), i.getPriorityScore(),
                net, store.listComments(i.getId()).size(), store.listEvaluations(i.getId()).size(),
                i.getSubmittedAt(), i.getCreatedAt()
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
        if (idea.getStage() == Stage.DRAFT
                && !idea.getAuthorId().equals(me.userId())
                && me.role() != Role.ADMIN && me.role() != Role.SUPERADMIN) {
            throw new EntityNotFoundException("Idea " + id);
        }
        // Touch field to avoid lazy-loading surprises in caller
        @SuppressWarnings("unused") OffsetDateTime _t = idea.getCreatedAt();
        return idea;
    }
}
