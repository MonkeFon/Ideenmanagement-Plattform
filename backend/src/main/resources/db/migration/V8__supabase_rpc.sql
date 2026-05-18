-- RPC wrappers for vector search.
--
-- Why: under the `supabase` profile the backend talks to Supabase via PostgREST and has
-- no JDBC datasource, so the raw `<=>` queries in JdbcEmbeddingStore are unreachable.
-- These functions are exposed automatically by PostgREST as POST /rpc/<name> and called
-- by SupabaseRpcEmbeddingStore.
--
-- These also work under the regular `postgres` profile (since Supabase is just Postgres);
-- they just go unused there because JdbcEmbeddingStore is preferred. Keeping them in the
-- same migration set means switching from `postgres` to `supabase` requires no extra DDL.

CREATE OR REPLACE FUNCTION upsert_idea_embedding(
    idea uuid,
    tenant uuid,
    embedding text,
    model text
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO idea_embeddings (idea_id, tenant_id, embedding, model)
    VALUES (idea, tenant, embedding::vector, model)
    ON CONFLICT (idea_id) DO UPDATE
      SET embedding = EXCLUDED.embedding,
          model     = EXCLUDED.model,
          tenant_id = EXCLUDED.tenant_id;
END;
$$;

-- Top-k semantic neighbours of a query vector, scoped to a tenant.
-- `exclude_idea` lets callers omit the source idea (use the zero UUID for free-text search).
CREATE OR REPLACE FUNCTION match_idea_embeddings(
    tenant uuid,
    exclude_idea uuid,
    query text,
    k int,
    threshold float
) RETURNS TABLE (
    id uuid,
    title text,
    description text,
    stage text,
    category text,
    similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
        SELECT i.id,
               i.title,
               i.description,
               i.stage::text,
               i.category,
               (1 - (e.embedding <=> query::vector))::float AS similarity
          FROM idea_embeddings e
          JOIN ideas i ON i.id = e.idea_id
         WHERE e.tenant_id = tenant
           AND e.idea_id <> exclude_idea
           AND 1 - (e.embedding <=> query::vector) >= threshold
         ORDER BY e.embedding <=> query::vector
         LIMIT k;
END;
$$;

-- All pairs of ideas in a tenant whose cosine similarity meets the threshold.
-- Pairs are deduped by ordering on idea_id.
CREATE OR REPLACE FUNCTION idea_embedding_pairs(
    tenant uuid,
    threshold float,
    max_pairs int
) RETURNS TABLE (
    a_id uuid,
    b_id uuid,
    similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
        SELECT e1.idea_id AS a_id,
               e2.idea_id AS b_id,
               (1 - (e1.embedding <=> e2.embedding))::float AS similarity
          FROM idea_embeddings e1
          JOIN idea_embeddings e2
            ON e2.tenant_id = e1.tenant_id
           AND e2.idea_id  > e1.idea_id
         WHERE e1.tenant_id = tenant
           AND 1 - (e1.embedding <=> e2.embedding) >= threshold
         ORDER BY similarity DESC
         LIMIT max_pairs;
END;
$$;
