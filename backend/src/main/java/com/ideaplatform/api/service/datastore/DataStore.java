package com.ideaplatform.api.service.datastore;

import com.ideaplatform.api.domain.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DataStore {

    Optional<Tenant> findTenant(UUID id);
    Tenant saveTenant(Tenant tenant);
    Optional<Plan> findPlanByCode(String code);
    List<Plan> listPlans();

    Optional<User> findUserByEmail(String email);
    Optional<User> findUserById(UUID id);
    User saveUser(User user);
    List<User> listUsersForTenant(UUID tenantId);

    Idea saveIdea(Idea idea);
    Optional<Idea> findIdea(UUID id);
    List<Idea> listIdeas(UUID tenantId, Stage stageOrNull);

    Optional<Vote> findVote(UUID ideaId, UUID userId);
    Vote saveVote(Vote vote);
    void deleteVote(UUID voteId);
    int netVotes(UUID ideaId);

    Comment saveComment(Comment c);
    List<Comment> listComments(UUID ideaId);

    Optional<Evaluation> findEvaluation(UUID ideaId, UUID reviewerId);
    Evaluation saveEvaluation(Evaluation e);
    List<Evaluation> listEvaluations(UUID ideaId);

    WorkflowHistory saveWorkflowEvent(WorkflowHistory h);
    List<WorkflowHistory> listWorkflowHistory(UUID ideaId);

    Optional<Campaign> findCampaign(UUID id);
    Optional<Campaign> findCampaignByTenantAndId(UUID tenantId, UUID id);
    List<Campaign> listCampaignsForTenant(UUID tenantId);
    boolean campaignNameTakenInTenant(UUID tenantId, String name);
    Campaign saveCampaign(Campaign c);
    void deleteCampaign(Campaign c);
    List<Idea> listIdeasInCampaign(UUID tenantId, UUID campaignId);
    long countIdeasInCampaign(UUID campaignId);

    long countActiveUsers(UUID tenantId);
    long countIdeasSubmittedSince(UUID tenantId, OffsetDateTime since);
}
