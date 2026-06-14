package com.ideaplatform.api.service.embedding;

import com.ideaplatform.api.dto.SimilarIdeaRow;
import com.ideaplatform.api.dto.SimilarPairRow;

import java.util.List;
import java.util.UUID;

/**
 * Pluggable storage for idea embeddings + vector search. Two implementations exist:
 * <ul>
 *   <li>{@code JdbcEmbeddingStore} — raw JDBC + pgvector. Default. Works against local
 *       Postgres or Supabase Postgres reached via JDBC (the {@code supabase-jdbc} profile).</li>
 *   <li>{@code SupabaseRpcEmbeddingStore} — calls PostgREST RPC functions. Activated by
 *       the {@code supabase} profile when JPA is not configured.</li>
 * </ul>
 *
 * The interface deliberately mirrors the queries used by callers — upsert, find similar to
 * a vector, find all pairs above threshold — so the JDBC implementation can stay terse and
 * the PostgREST implementation can map 1:1 onto Postgres functions exposed via PostgREST.
 */
public interface EmbeddingStore {

    /** Upserts an embedding. Tenant must match the parent idea (caller's responsibility). */
    void upsert(UUID ideaId, UUID tenantId, float[] embedding, String model);

    /**
     * All similar pairs in a tenant above the threshold. Each unordered pair appears once
     * (idea_id ordered ascending) so the caller does not have to dedupe.
     */
    List<SimilarPairRow> findAllSimilarPairs(UUID tenantId, double threshold, int maxPairs);

    /** Top-k most similar ideas to the supplied vector, excluding the source idea itself. */
    List<SimilarIdeaRow> findSimilar(UUID tenantId, UUID excludeIdeaId, float[] query, int k, double threshold);

    /**
     * Hybrid search: blends vector similarity with a keyword (full-text) match on the idea
     * title/description, so a query that literally contains an idea's words surfaces that
     * idea even when the pure-vector cosine is mediocre, while conceptual queries still work.
     * {@code queryText} is the raw user query (for the keyword side); {@code query} is its
     * embedding (for the vector side). Falls back to vector-only behaviour when an
     * implementation can't do full-text (see the Supabase RPC store).
     */
    default List<SimilarIdeaRow> findHybrid(UUID tenantId, UUID excludeIdeaId, float[] query,
                                            String queryText, int k, double threshold) {
        // Safe default: ignore the keyword side. JDBC overrides this with a real blend.
        return findSimilar(tenantId, excludeIdeaId, query, k, threshold);
    }
}
