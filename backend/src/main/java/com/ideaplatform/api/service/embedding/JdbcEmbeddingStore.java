package com.ideaplatform.api.service.embedding;

import com.ideaplatform.api.dto.SimilarIdeaRow;
import com.ideaplatform.api.dto.SimilarPairRow;
import com.ideaplatform.api.tenant.LocaleContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Vector search via raw JDBC + pgvector. Active for both {@code postgres} and
 * {@code supabase-jdbc} profiles (anything with a real JDBC datasource pointing at a
 * Postgres + pgvector). Hibernate cannot generate the {@code <=>} operator on its own.
 */
@Repository
@ConditionalOnProperty(name = "ideaplatform.embedding.store", havingValue = "jdbc", matchIfMissing = true)
public class JdbcEmbeddingStore implements EmbeddingStore {

    private final JdbcTemplate jdbc;

    public JdbcEmbeddingStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
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

    @Override
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

    @Override
    public List<SimilarIdeaRow> findSimilar(UUID tenantId, UUID excludeIdeaId, float[] query, int k, double threshold) {
        String vec = toVectorLiteral(query);
        // When the request locale is German, return the translated title/description
        // (falling back to the original where a translation is missing) so search hits
        // and snippets render in German rather than the English seed text. The column
        // expressions are constant — no user input is interpolated.
        boolean de = LocaleContext.isGerman();
        String titleCol = de ? "COALESCE(i.title_de, i.title)" : "i.title";
        String descCol  = de ? "COALESCE(i.description_de, i.description)" : "i.description";
        // Only surface tenant-visible ideas. DRAFTs are private to their author (a freshly
        // created idea is indexed immediately while still a DRAFT), and REJECTED/ARCHIVED
        // ideas are retired — none of them should appear in another user's semantic search
        // or in the "similar ideas" sidebar. Without this filter a private draft leaks its
        // title + snippet tenant-wide even though GET /ideas/{id} 404s for non-authors.
        return jdbc.query("""
            SELECT i.id, %s AS title, %s AS description, i.stage, i.category,
                   1 - (e.embedding <=> ?::vector) AS similarity
              FROM idea_embeddings e
              JOIN ideas i ON i.id = e.idea_id
             WHERE e.tenant_id = ?
               AND e.idea_id <> ?
               AND i.stage NOT IN ('DRAFT', 'REJECTED', 'ARCHIVED')
               AND 1 - (e.embedding <=> ?::vector) >= ?
             ORDER BY e.embedding <=> ?::vector
             LIMIT ?
            """.formatted(titleCol, descCol),
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
