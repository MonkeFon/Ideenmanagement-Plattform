package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.*;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import com.ideaplatform.api.workflow.IdeaWorkflow;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class WorkflowService {

    private final DataStore store;
    private final ScoringService scoring;

    public WorkflowService(DataStore store, ScoringService scoring) {
        this.store = store;
        this.scoring = scoring;
    }

    @Transactional
    public Idea transition(UUID ideaId, Stage to, String reason, AuthPrincipal actor) {
        Idea idea = store.findIdea(ideaId).orElseThrow(() -> new EntityNotFoundException("Idea " + ideaId));
        if (!idea.getTenantId().equals(actor.tenantId()) && actor.role() != Role.SUPERADMIN) {
            throw new IllegalStateException("Cross-tenant transition denied");
        }
        Stage from = idea.getStage();
        if (!IdeaWorkflow.canTransition(from, to, actor.role())) {
            throw new IllegalStateException("Transition " + from + " -> " + to + " not allowed for role " + actor.role());
        }
        if (to == Stage.PRIORITIZATION) {
            if (store.listEvaluations(ideaId).isEmpty()) {
                throw new IllegalStateException("At least one reviewer evaluation is required before PRIORITIZATION");
            }
            idea.setPriorityScore(scoring.computeFor(ideaId, idea.getSubmittedAt(), idea.isSponsorBoost()));
        }
        if (to == Stage.SUBMITTED && idea.getSubmittedAt() == null) {
            idea.setSubmittedAt(OffsetDateTime.now());
        }
        idea.setStage(to);
        store.saveIdea(idea);

        store.saveWorkflowEvent(WorkflowHistory.builder()
                .tenantId(idea.getTenantId())
                .ideaId(ideaId)
                .fromStage(from)
                .toStage(to)
                .actorId(actor.userId())
                .reason(reason)
                .build());
        return idea;
    }
}
