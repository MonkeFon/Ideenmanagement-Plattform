package com.ideaplatform.api.service.datastore;

import com.ideaplatform.api.domain.*;
import com.ideaplatform.api.repo.*;
import com.ideaplatform.api.tenant.TenantContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "ideaplatform.datastore.impl", havingValue = "jpa", matchIfMissing = true)
public class JpaDataStore implements DataStore {

    private final TenantRepository tenants;
    private final PlanRepository plans;
    private final UserRepository users;
    private final IdeaRepository ideas;
    private final VoteRepository votes;
    private final CommentRepository comments;
    private final EvaluationRepository evals;
    private final WorkflowHistoryRepository history;

    public JpaDataStore(TenantRepository tenants, PlanRepository plans, UserRepository users,
                        IdeaRepository ideas, VoteRepository votes, CommentRepository comments,
                        EvaluationRepository evals, WorkflowHistoryRepository history) {
        this.tenants = tenants; this.plans = plans; this.users = users;
        this.ideas = ideas; this.votes = votes; this.comments = comments;
        this.evals = evals; this.history = history;
    }

    @Override public Optional<Tenant> findTenant(UUID id) { return tenants.findById(id); }
    @Override public Optional<Plan> findPlanByCode(String c) { return plans.findByCode(c); }

    @Override public Optional<User> findUserByEmail(String email) { return users.findByEmail(email); }
    @Override public Optional<User> findUserById(UUID id) { return users.findById(id); }
    @Override public User saveUser(User u) { return users.save(u); }
    @Override public List<User> listUsersForTenant(UUID tenantId) {
        // Explicit tenant scoping. We do not rely on the Hibernate session filter for this
        // call because open-in-view is disabled, which means the session enabled inside the
        // servlet filter is not guaranteed to be the same as the one a downstream
        // @Transactional method opens. Explicit beats clever.
        return users.findByTenantId(tenantId);
    }

    @Override public Idea saveIdea(Idea i) {
        // saveAndFlush — the embedding indexer that runs immediately after uses raw JDBC
        // and would otherwise hit a FK violation on idea_embeddings.idea_id because Hibernate
        // hasn't flushed the parent INSERT yet.
        return ideas.saveAndFlush(i);
    }
    @Override public Optional<Idea> findIdea(UUID id) { return ideas.findById(id); }
    @Override public List<Idea> listIdeas(UUID tenantId, Stage stage) {
        return stage == null
                ? ideas.findByTenantIdOrderByCreatedAtDesc(tenantId)
                : ideas.findByTenantIdAndStageOrderByPriorityScoreDescCreatedAtDesc(tenantId, stage);
    }

    @Override public Optional<Vote> findVote(UUID ideaId, UUID userId) { return votes.findByIdeaIdAndUserId(ideaId, userId); }
    @Override public Vote saveVote(Vote v) { return votes.save(v); }
    @Override public void deleteVote(UUID voteId) { votes.deleteById(voteId); }
    @Override public int netVotes(UUID ideaId) { return votes.netScore(ideaId); }

    @Override public Comment saveComment(Comment c) { return comments.save(c); }
    @Override public List<Comment> listComments(UUID ideaId) { return comments.findByIdeaIdOrderByCreatedAtAsc(ideaId); }

    @Override public Optional<Evaluation> findEvaluation(UUID ideaId, UUID reviewerId) { return evals.findByIdeaIdAndReviewerId(ideaId, reviewerId); }
    @Override public Evaluation saveEvaluation(Evaluation e) { return evals.save(e); }
    @Override public List<Evaluation> listEvaluations(UUID ideaId) { return evals.findByIdeaId(ideaId); }

    @Override public WorkflowHistory saveWorkflowEvent(WorkflowHistory h) { return history.save(h); }
    @Override public List<WorkflowHistory> listWorkflowHistory(UUID ideaId) { return history.findByIdeaIdOrderByCreatedAtAsc(ideaId); }

    @Override public long countActiveUsers(UUID tenantId) { return users.countByTenantIdAndActiveTrue(tenantId); }
    @Override public long countIdeasSubmittedSince(UUID tenantId, OffsetDateTime since) {
        return ideas.countSubmittedSince(tenantId, since);
    }

    @SuppressWarnings("unused")
    private UUID currentTenant() { return TenantContext.get(); }
}
