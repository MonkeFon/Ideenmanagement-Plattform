package com.ideaplatform.api.repo;

import com.ideaplatform.api.dto.SimilarIdeaRow;
import com.ideaplatform.api.dto.SimilarPairRow;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Vector search lives outside JPA because Hibernate cannot generate the `<=>` operator.
 * We use raw JDBC against pgvector. The query is tenant-scoped explicitly.
 */
@Repository
public class IdeaEmbeddingRepository {

    private final JdbcTemplate jdbc;

    @PersistenceContext
    private EntityManager em;

    public IdeaEmbeddingRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Upserts an embedding. Tenant must match the parent idea (callers guarantee this). */
    public void upsert(UUID ideaId, UUID tenantId, float[] embedding, String model) {
        String vec = toVectorLiteral(embedding);
        jdbc.update("""
            INSERT INTO idea_embeddings (idea_id, tenant_id, embedding, model)
            VALUES (?, ?, ?::vector, ?)
            ON CONFLICT (idea_id) DO UPDATE
              SET embedding = EXCLUDED.embedding,
                  model     = EXCLUDED.model,
                  tenant_id = EXCLUDED.tenant_id
            """, ideaId, tenantId, vec, model);
    }

    /**
     * All similar pairs in a tenant above the threshold. Each unordered pair appears once
     * (idea_id ordered ascending) so the caller doesn't have to dedupe.
     */
    public List<SimilarPairRow> findAllSimilarPairs(UUID tenantId, double threshold, int maxPairs) {
        return jdbc.query("""
            SELECT e1.idea_id AS a_id,
                   e2.idea_id AS b_id,
                   1 - (e1.embedding <=> e2.embedding) AS similarity
              FROM idea_embeddings e1
              JOIN idea_embeddings e2
                ON e2.tenant_id = e1.tenant_id
               AND e2.idea_id  > e1.idea_id
             WHERE e1.tenant_id = ?
               AND 1 - (e1.embedding <=> e2.embedding) >= ?
             ORDER BY similarity DESC
             LIMIT ?
            """,
            (rs, rowNum) -> new SimilarPairRow(
                UUID.fromString(rs.getString("a_id")),
                UUID.fromString(rs.getString("b_id")),
                rs.getDouble("similarity")
            ),
            tenantId, threshold, maxPairs);
    }

    /** Top-k most similar ideas to the supplied vector, excluding the source idea itself. */
    public List<SimilarIdeaRow> findSimilar(UUID tenantId, UUID excludeIdeaId, float[] query, int k, double threshold) {
        String vec = toVectorLiteral(query);
        // cosine distance via `<=>`. similarity = 1 - distance.
        return jdbc.query("""
            SELECT i.id, i.title, i.description, i.stage, i.category,
                   1 - (e.embedding <=> ?::vector) AS similarity
              FROM idea_embeddings e
              JOIN ideas i ON i.id = e.idea_id
             WHERE e.tenant_id = ?
               AND e.idea_id <> ?
               AND 1 - (e.embedding <=> ?::vector) >= ?
             ORDER BY e.embedding <=> ?::vector
             LIMIT ?
            """,
            (rs, rowNum) -> new SimilarIdeaRow(
                UUID.fromString(rs.getString("id")),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("stage"),
                rs.getString("category"),
                rs.getDouble("similarity")
            ),
            vec, tenantId, excludeIdeaId, vec, threshold, vec, k);
    }

    private static String toVectorLiteral(float[] v) {
        StringBuilder sb = new StringBuilder(v.length * 8).append('[');
        for (int i = 0; i < v.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(v[i]);
        }
        return sb.append(']').toString();
    }
}
