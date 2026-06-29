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
    private final CampaignRepository campaigns;

    public JpaDataStore(TenantRepository tenants, PlanRepository plans, UserRepository users,
                        IdeaRepository ideas, VoteRepository votes, CommentRepository comments,
                        EvaluationRepository evals, WorkflowHistoryRepository history,
                        CampaignRepository campaigns) {
        this.tenants = tenants; this.plans = plans; this.users = users;
        this.ideas = ideas; this.votes = votes; this.comments = comments;
        this.evals = evals; this.history = history; this.campaigns = campaigns;
    }

    @Override public Optional<Tenant> findTenant(UUID id) { return tenants.findById(id); }
    @Override public Tenant saveTenant(Tenant t) { return tenants.save(t); }
    @Override public Optional<Plan> findPlanByCode(String c) { return plans.findByCode(c); }
    @Override public List<Plan> listPlans() { return plans.findAll(); }

    @Override public Optional<User> findUserByEmail(String email) { return users.findByEmail(email); }
    @Override public Optional<User> findUserById(UUID id) { return users.findById(id); }
    @Override public User saveUser(User u) { return users.save(u); }
    @Override public List<User> listUsersForTenant(UUID tenantId) {

        return users.findByTenantId(tenantId);
    }

    @Override public Idea saveIdea(Idea i) {

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

    @Override public Optional<Campaign> findCampaign(UUID id) { return campaigns.findById(id); }
    @Override public Optional<Campaign> findCampaignByTenantAndId(UUID tenantId, UUID id) {
        return campaigns.findByTenantIdAndId(tenantId, id);
    }
    @Override public List<Campaign> listCampaignsForTenant(UUID tenantId) {
        return campaigns.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }
    @Override public boolean campaignNameTakenInTenant(UUID tenantId, String name) {
        return campaigns.existsByTenantIdAndName(tenantId, name);
    }
    @Override public Campaign saveCampaign(Campaign c) { return campaigns.save(c); }
    @Override public void deleteCampaign(Campaign c) { campaigns.delete(c); }
    @Override public List<Idea> listIdeasInCampaign(UUID tenantId, UUID campaignId) {
        return ideas.findByTenantIdAndCampaignIdOrderByCreatedAtDesc(tenantId, campaignId);
    }
    @Override public long countIdeasInCampaign(UUID campaignId) { return ideas.countByCampaignId(campaignId); }

    @Override public long countActiveUsers(UUID tenantId) { return users.countByTenantIdAndActiveTrue(tenantId); }
    @Override public long countIdeasSubmittedSince(UUID tenantId, OffsetDateTime since) {
        return ideas.countSubmittedSince(tenantId, since);
    }

    @SuppressWarnings("unused")
    private UUID currentTenant() { return TenantContext.get(); }
}
