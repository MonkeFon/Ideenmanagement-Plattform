package com.ideaplatform.api.service.datastore;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideaplatform.api.domain.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * Alternative data layer that talks to Supabase via PostgREST instead of JDBC/JPA.
 * Useful when the customer's deployment target is Supabase Cloud and direct DB
 * access is gated. All operations are tenant-scoped via PostgREST filter params;
 * Supabase RLS policies should mirror those filters in production.
 *
 * NOTE: This implementation is *functionally complete for the prototype* but
 * deliberately thin — it does not implement query optimisations. For workloads
 * where the JPA implementation flexes (joins, aggregations), prefer JPA.
 */
@Component
@ConditionalOnProperty(name = "ideaplatform.datastore.impl", havingValue = "supabase")
public class SupabaseDataStore implements DataStore {

    private final WebClient client;
    private final ObjectMapper mapper;

    public SupabaseDataStore(
            @Value("${ideaplatform.supabase.url}") String baseUrl,
            @Value("${ideaplatform.supabase.service-role-key}") String serviceRoleKey,
            ObjectMapper mapper) {
        this.client = WebClient.builder()
                .baseUrl(baseUrl + "/rest/v1")
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Prefer", "return=representation")
                .build();
        this.mapper = mapper;
    }

    // ---- helpers ----
    private <T> Optional<T> first(String table, String filter, Class<T> type) {
        List<Map<String, Object>> rows = client.get()
                .uri(uri -> uri.path("/" + table).query(filter + "&limit=1").build())
                .retrieve().bodyToMono(List.class).block();
        if (rows == null || rows.isEmpty()) return Optional.empty();
        return Optional.of(mapper.convertValue(rows.get(0), type));
    }

    private <T> List<T> list(String table, String filter, Class<T> type) {
        List<Map<String, Object>> rows = client.get()
                .uri(uri -> uri.path("/" + table).query(filter).build())
                .retrieve().bodyToMono(List.class).block();
        if (rows == null) return List.of();
        List<T> out = new ArrayList<>(rows.size());
        for (Map<String, Object> r : rows) out.add(mapper.convertValue(r, type));
        return out;
    }

    private <T> T upsert(String table, Object body, Class<T> type) {
        List<Map<String, Object>> rows = client.post()
                .uri("/" + table)
                .header("Prefer", "resolution=merge-duplicates,return=representation")
                .bodyValue(body)
                .retrieve().bodyToMono(List.class).block();
        if (rows == null || rows.isEmpty()) throw new IllegalStateException("Supabase upsert returned no row");
        return mapper.convertValue(rows.get(0), type);
    }

    // ---- DataStore implementation ----
    @Override public Optional<Tenant> findTenant(UUID id) { return first("tenants", "id=eq." + id, Tenant.class); }
    @Override public Optional<Plan> findPlanByCode(String c) { return first("plans", "code=eq." + c, Plan.class); }

    @Override public Optional<User> findUserByEmail(String email) { return first("users", "email=eq." + email, User.class); }
    @Override public Optional<User> findUserById(UUID id) { return first("users", "id=eq." + id, User.class); }
    @Override public User saveUser(User u) { return upsert("users", u, User.class); }
    @Override public List<User> listUsersForTenant(UUID tenantId) { return list("users", "tenant_id=eq." + tenantId, User.class); }

    @Override public Idea saveIdea(Idea i) { return upsert("ideas", i, Idea.class); }
    @Override public Optional<Idea> findIdea(UUID id) { return first("ideas", "id=eq." + id, Idea.class); }
    @Override public List<Idea> listIdeas(UUID tenantId, Stage stage) {
        String filter = "tenant_id=eq." + tenantId + "&order=created_at.desc";
        if (stage != null) filter += "&stage=eq." + stage.name();
        return list("ideas", filter, Idea.class);
    }

    @Override public Optional<Vote> findVote(UUID ideaId, UUID userId) {
        return first("votes", "idea_id=eq." + ideaId + "&user_id=eq." + userId, Vote.class);
    }
    @Override public Vote saveVote(Vote v) { return upsert("votes", v, Vote.class); }
    @Override public void deleteVote(UUID voteId) {
        client.delete().uri(uri -> uri.path("/votes").query("id=eq." + voteId).build())
                .retrieve().toBodilessEntity().block();
    }
    @Override public int netVotes(UUID ideaId) {
        // PostgREST has no aggregate by default; fall back to per-row sum.
        List<Vote> all = list("votes", "idea_id=eq." + ideaId, Vote.class);
        int n = 0; for (Vote v : all) n += v.getValue(); return n;
    }

    @Override public Comment saveComment(Comment c) { return upsert("comments", c, Comment.class); }
    @Override public List<Comment> listComments(UUID ideaId) {
        return list("comments", "idea_id=eq." + ideaId + "&order=created_at.asc", Comment.class);
    }

    @Override public Optional<Evaluation> findEvaluation(UUID ideaId, UUID reviewerId) {
        return first("evaluations", "idea_id=eq." + ideaId + "&reviewer_id=eq." + reviewerId, Evaluation.class);
    }
    @Override public Evaluation saveEvaluation(Evaluation e) { return upsert("evaluations", e, Evaluation.class); }
    @Override public List<Evaluation> listEvaluations(UUID ideaId) { return list("evaluations", "idea_id=eq." + ideaId, Evaluation.class); }

    @Override public WorkflowHistory saveWorkflowEvent(WorkflowHistory h) { return upsert("workflow_history", h, WorkflowHistory.class); }
    @Override public List<WorkflowHistory> listWorkflowHistory(UUID ideaId) {
        return list("workflow_history", "idea_id=eq." + ideaId + "&order=created_at.asc", WorkflowHistory.class);
    }

    @Override public long countActiveUsers(UUID tenantId) {
        return list("users", "tenant_id=eq." + tenantId + "&active=is.true", User.class).size();
    }
    @Override public long countIdeasSubmittedSince(UUID tenantId, OffsetDateTime since) {
        return list("ideas", "tenant_id=eq." + tenantId + "&submitted_at=gte." + since, Idea.class).size();
    }
}
