package com.ideaplatform.api.service;

import com.ideaplatform.api.domain.Idea;
import com.ideaplatform.api.domain.Vote;
import com.ideaplatform.api.security.AuthPrincipal;
import com.ideaplatform.api.service.datastore.DataStore;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class VoteService {

    private final DataStore store;
    private final ScoringService scoring;

    public VoteService(DataStore store, ScoringService scoring) {
        this.store = store;
        this.scoring = scoring;
    }

    /**
     * Idempotent vote: same value re-applied is a no-op, flipped value updates, +-0 removes.
     * Returns the new net score for the idea.
     */
    @Transactional
    public int castVote(UUID ideaId, short value, AuthPrincipal me) {
        if (value != -1 && value != 0 && value != 1) {
            throw new IllegalArgumentException("Vote value must be -1, 0, or 1");
        }
        Idea idea = store.findIdea(ideaId).orElseThrow(() -> new EntityNotFoundException("Idea " + ideaId));
        if (!idea.getTenantId().equals(me.tenantId())) throw new EntityNotFoundException("Idea " + ideaId);

        var existing = store.findVote(ideaId, me.userId());
        if (value == 0) {
            existing.ifPresent(v -> store.deleteVote(v.getId()));
        } else if (existing.isPresent()) {
            Vote v = existing.get();
            if (v.getValue() != value) {
                v.setValue(value);
                store.saveVote(v);
            }
        } else {
            store.saveVote(Vote.builder()
                    .tenantId(idea.getTenantId())
                    .ideaId(ideaId)
                    .userId(me.userId())
                    .value(value)
                    .build());
        }

        int net = store.netVotes(ideaId);
        idea.setPriorityScore(scoring.computeFor(ideaId, idea.getSubmittedAt(), idea.isSponsorBoost()));
        store.saveIdea(idea);
        return net;
    }
}
