-- ──────────────────────────────────────────────────────────────────────────────
-- Defense-in-depth tenant isolation via PostgreSQL Row-Level Security (RLS).
--
-- The application already scopes by tenant, but only Idea and User carry a Hibernate
-- tenant filter; comments, votes, evaluations, campaigns and workflow_history rely on
-- per-query discipline, and the raw-JDBC vector search adds tenant_id by hand. A single
-- forgotten clause would silently leak across tenants. RLS makes the *database* reject
-- cross-tenant rows on every table, regardless of the query path or ORM.
--
-- How the per-request tenant reaches the DB:
--   The app publishes it into the custom GUC `app.tenant_id` on every pooled-connection
--   borrow (see TenantAwareDataSource). The policy restricts rows to that tenant.
--
-- Why the policy is permissive when the GUC is empty/unset:
--   Trusted, tenant-agnostic paths run without a tenant in context and must keep working:
--     • Flyway migrations (this file and future ones)
--     • the on-boot EmbeddingBootstrapper (indexes every tenant's ideas)
--     • the pre-authentication login lookup (resolves a user before any tenant is known)
--   For those, app.tenant_id is '' / unset → full access. Authenticated request traffic
--   always has the GUC set, so it is always restricted to its own tenant.
--
-- The app connects as the table owner, and owners bypass RLS unless it is FORCEd — hence
-- FORCE ROW LEVEL SECURITY below. (Consequently pg_dump must pass --enable-row-security;
-- scripts/seed-snapshot.sh does.)
-- ──────────────────────────────────────────────────────────────────────────────
DO $mig$
DECLARE
  t   text;
  pol text :=
        'current_setting(''app.tenant_id'', true) IS NULL '
        'OR current_setting(''app.tenant_id'', true) = '''' '
        'OR tenant_id = current_setting(''app.tenant_id'', true)::uuid';
BEGIN
  FOREACH t IN ARRAY ARRAY[
      'ideas','users','comments','votes','evaluations','campaigns','workflow_history','idea_embeddings'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (%s) WITH CHECK (%s)', t, pol, pol);
  END LOOP;
END
$mig$;
