-- Human-readable, Jira-style reference number for ideas.
--
-- Each idea gets a per-tenant sequential integer (1, 2, 3, …) assigned in creation
-- order. The UI renders it as a project key like "GEIST-7" — the same key the mock
-- Jira hand-off uses, so an idea and its delivery ticket read as one and the same.
--
-- Assigned at insert time by the service (MAX(reference)+1 per tenant); this migration
-- backfills the existing rows and locks in the per-tenant uniqueness.

ALTER TABLE ideas ADD COLUMN reference INTEGER;

-- Backfill: number each tenant's ideas by creation order (id as a stable tiebreaker).
WITH numbered AS (
    SELECT id, row_number() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn
    FROM ideas
)
UPDATE ideas i SET reference = n.rn
FROM numbered n
WHERE n.id = i.id;

ALTER TABLE ideas ALTER COLUMN reference SET NOT NULL;

-- One sequence space per tenant.
CREATE UNIQUE INDEX idx_ideas_tenant_reference ON ideas (tenant_id, reference);
