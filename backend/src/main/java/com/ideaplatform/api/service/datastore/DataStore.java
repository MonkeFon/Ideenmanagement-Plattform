package com.ideaplatform.api.service.datastore;

import com.ideaplatform.api.domain.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Storage-agnostic facade so services can talk to either Postgres-via-JPA or Supabase-via-REST.
 *
 * The interface is deliberately narrow — only operations that have a meaningfully
 * different implementation between the two backends live here. Anything that's a pure
 * SQL query (e.g. similarity search) stays in its specialised repository.
 */
public interface DataStore {

    // tenants & plans
    Optional<Tenant> findTenant(UUID id);
    Optional<Plan> findPlanByCode(String code);

    // users
    Optional<User> findUserByEmail(String email);
    Optional<User> findUserById(UUID id);
    User saveUser(User user);
    List<User> listUsersForTenant(UUID tenantId);

    // ideas
    Idea saveIdea(Idea idea);
    Optional<Idea> findIdea(UUID id);
    List<Idea> listIdeas(UUID tenantId, Stage stageOrNull);

    // votes
    Optional<Vote> findVote(UUID ideaId, UUID userId);
    Vote saveVote(Vote vote);
    void deleteVote(UUID voteId);
    int netVotes(UUID ideaId);

    // comments
    Comment saveComment(Comment c);
    List<Comment> listComments(UUID ideaId);

    // evaluations
    Optional<Evaluation> findEvaluation(UUID ideaId, UUID reviewerId);
    Evaluation saveEvaluation(Evaluation e);
    List<Evaluation> listEvaluations(UUID ideaId);

    // workflow
    WorkflowHistory saveWorkflowEvent(WorkflowHistory h);
    List<WorkflowHistory> listWorkflowHistory(UUID ideaId);

    // quota helpers
    long countActiveUsers(UUID tenantId);
    long countIdeasSubmittedSince(UUID tenantId, OffsetDateTime since);
}
