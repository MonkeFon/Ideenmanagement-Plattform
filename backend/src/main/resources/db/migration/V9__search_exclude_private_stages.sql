-- Exclude non-visible idea stages from semantic search / "similar ideas".
--
-- Bug: match_idea_embeddings (Supabase/PostgREST path) joined ideas without a stage
-- filter, so a freshly created DRAFT — which is private to its author but is embedded
-- immediately on creation — leaked its title + snippet into every tenant member's
-- search results (and the similar-ideas sidebar), even though GET /ideas/{id} 404s for
-- non-authors. REJECTED/ARCHIVED ideas leaked the same way. The JDBC path (JdbcEmbeddingStore)
-- is fixed in Java with the same predicate; this keeps the RPC path consistent.
--
-- Redefining the function (CREATE OR REPLACE) — signature unchanged.
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
           AND i.stage NOT IN ('DRAFT', 'REJECTED', 'ARCHIVED')
           AND 1 - (e.embedding <=> query::vector) >= threshold
         ORDER BY e.embedding <=> query::vector
         LIMIT k;
END;
$$;
