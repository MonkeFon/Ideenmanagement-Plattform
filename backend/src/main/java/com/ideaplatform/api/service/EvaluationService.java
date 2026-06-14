package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Evaluation;
import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.Role;
import com.ideaplatform.api.domain.User;
import com.ideaplatform.api.dto.IdeaDtos.EvaluationRequest;
import com.ideaplatform.api.dto.IdeaDtos.EvaluationResponse;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EvaluationService {

    private final DataStore store;
    private final ScoringService scoring;

    public EvaluationService(DataStore store, ScoringService scoring) {
        this.store = store;
        this.scoring = scoring;
    }

    @Transactional
    public EvaluationResponse upsert(UUID ideaId, EvaluationRequest req, AuthPrincipal me) {
        if (me.role() != Role.REVIEWER && me.role() != Role.IDEA_MANAGER && me.role() != Role.ADMIN) {
            throw new IllegalStateException("Only REVIEWER, IDEA_MANAGER, or ADMIN can evaluate");
        }
        validateRange(req);
        Idea idea = store.findIdea(ideaId).orElseThrow(() -> new EntityNotFoundException("Idea " + ideaId));
        if (!idea.getTenantId().equals(me.tenantId())) throw new EntityNotFoundException("Idea " + ideaId);

        Evaluation e = store.findEvaluation(ideaId, me.userId()).orElseGet(() ->
                Evaluation.builder()
                        .tenantId(idea.getTenantId())
                        .ideaId(ideaId)
                        .reviewerId(me.userId())
                        .build());
        e.setImpact(req.impact());
        e.setFeasibility(req.feasibility());
        e.setStrategicFit(req.strategicFit());
        e.setNotes(req.notes());
        e = store.saveEvaluation(e);

        idea.setPriorityScore(scoring.computeFor(ideaId, idea.getSubmittedAt(), idea.isSponsorBoost()));
        store.saveIdea(idea);

        return toResponse(e, me.email());
    }

    public List<EvaluationResponse> list(UUID ideaId, AuthPrincipal me) {
        return store.listEvaluations(ideaId).stream()
                .map(e -> toResponse(e, store.findUserById(e.getReviewerId()).map(User::getDisplayName).orElse("Reviewer")))
                .toList();
    }

    private EvaluationResponse toResponse(Evaluation e, String reviewerName) {
        return new EvaluationResponse(
                e.getId(), e.getReviewerId(), reviewerName,
                e.getImpact(), e.getFeasibility(), e.getStrategicFit(),
                e.average(), e.getNotes(), e.getCreatedAt());
    }

    private static void validateRange(EvaluationRequest r) {
        check(r.impact(), "impact");
        check(r.feasibility(), "feasibility");
        check(r.strategicFit(), "strategicFit");
    }

    private static void check(short v, String name) {
        if (v < 1 || v > 5) throw new IllegalArgumentException(name + " must be 1..5");
    }
}
