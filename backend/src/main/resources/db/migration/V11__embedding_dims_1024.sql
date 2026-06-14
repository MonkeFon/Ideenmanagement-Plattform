-- Switch the embedding model from nomic-embed-text (768-d, English-primary) to bge-m3
-- (1024-d, multilingual). nomic compressed German topics into a narrow score band, so on
-- the German-canonical corpus the right idea often wasn't even in the top-5; bge-m3 has
-- much stronger German separation.
--
-- Changing the pgvector dimension requires:
--   1. dropping the ivfflat index (it is bound to the old dimension),
--   2. clearing existing 768-d vectors (incompatible with the new column type),
--   3. widening the column to vector(1024),
--   4. recreating the index.
-- The EmbeddingBootstrapper re-indexes every idea with bge-m3 on the next boot, so the
-- emptied table refills automatically — no manual reindex step.

DROP INDEX IF EXISTS idx_idea_embeddings_vector;

-- Old 768-d rows can't be cast to vector(1024); drop them so the bootstrapper rebuilds
-- them from scratch with the new model.
TRUNCATE TABLE idea_embeddings;

ALTER TABLE idea_embeddings
    ALTER COLUMN embedding TYPE vector(1024);

CREATE INDEX idx_idea_embeddings_vector
    ON idea_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
