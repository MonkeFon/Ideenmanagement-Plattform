package com.ideaplatform.api.service.embedding;

import com.ideaplatform.api.dto.SimilarIdeaRow;
import com.ideaplatform.api.dto.SimilarPairRow;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

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

        String titleCol = "i.title";
        String descCol  = "i.description";

        return jdbc.query("""
            SELECT i.id, %s AS title, %s AS description, i.stage, i.category,
                   1 - (e.embedding <=> ?::vector) AS similarity
              FROM idea_embeddings e
              JOIN ideas i ON i.id = e.idea_id
             WHERE e.tenant_id = ?
               AND e.idea_id <> ?
               AND i.stage NOT IN ('REJECTED', 'ARCHIVED')
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

    @Override
    public List<SimilarIdeaRow> findHybrid(UUID tenantId, UUID excludeIdeaId, float[] query,
                                           String queryText, int k, double threshold) {
        String vec = toVectorLiteral(query);
        String titleCol = "i.title";
        String descCol  = "i.description";

        String ftsCfg = "german";

        String doc = "(" + titleCol + " || ' ' || " + descCol + ")";
        String tsv = "to_tsvector('" + ftsCfg + "', " + doc + ")";
        String tsq = "websearch_to_tsquery('" + ftsCfg + "', ?)";
        String sql = """
            SELECT id, title, description, stage, category, similarity FROM (
              SELECT i.id,
                     %s AS title,
                     %s AS description,
                     i.stage,
                     i.category,
                     (1 - (e.embedding <=> ?::vector))
                       + 0.30 * LEAST(ts_rank(%s, %s), 1.0)
                       + CASE WHEN %s ILIKE '%%' || ? || '%%' THEN 0.15 ELSE 0 END
                       AS similarity,
                     (1 - (e.embedding <=> ?::vector)) AS vec_sim,
                     (%s @@ %s) AS kw_hit
                FROM idea_embeddings e
                JOIN ideas i ON i.id = e.idea_id
               WHERE e.tenant_id = ?
                 AND e.idea_id <> ?
                 AND i.stage NOT IN ('REJECTED', 'ARCHIVED')
              ) sub
             WHERE vec_sim >= ? OR kw_hit
             ORDER BY similarity DESC
             LIMIT ?
            """.formatted(titleCol, descCol, tsv, tsq, titleCol, tsv, tsq);
        return jdbc.query(sql,
            (rs, rowNum) -> new SimilarIdeaRow(
                UUID.fromString(rs.getString("id")),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("stage"),
                rs.getString("category"),
                rs.getDouble("similarity")
            ),

            vec,
            queryText,
            queryText,
            vec,
            queryText,
            tenantId, excludeIdeaId,
            threshold, k);
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
