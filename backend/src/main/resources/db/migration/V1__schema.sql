CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE plans (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code          VARCHAR(32) NOT NULL UNIQUE,
    display_name  VARCHAR(64) NOT NULL,
    seat_limit    INTEGER,                       -- NULL = unlimited
    idea_limit    INTEGER,                       -- per month, NULL = unlimited
    features      JSONB NOT NULL DEFAULT '[]',   -- e.g. ["rag_refine","custom_wf"]
    price_eur     NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(128) NOT NULL,
    slug            VARCHAR(64) NOT NULL UNIQUE,
    plan_id         UUID NOT NULL REFERENCES plans(id),
    plan_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    display_name    VARCHAR(128) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(32) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

CREATE TABLE ideas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(64),
    stage           VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    sponsor_boost   BOOLEAN NOT NULL DEFAULT FALSE,
    priority_score  DOUBLE PRECISION,
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ideas_tenant_stage ON ideas(tenant_id, stage);
CREATE INDEX idx_ideas_author ON ideas(author_id);

CREATE TABLE votes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    idea_id     UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (idea_id, user_id)
);
CREATE INDEX idx_votes_idea ON votes(idea_id);

CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    idea_id     UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_idea ON comments(idea_id);

CREATE TABLE evaluations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    idea_id         UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    impact          SMALLINT NOT NULL CHECK (impact BETWEEN 1 AND 5),
    feasibility     SMALLINT NOT NULL CHECK (feasibility BETWEEN 1 AND 5),
    strategic_fit   SMALLINT NOT NULL CHECK (strategic_fit BETWEEN 1 AND 5),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (idea_id, reviewer_id)
);

CREATE TABLE workflow_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    idea_id     UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    from_stage  VARCHAR(32),
    to_stage    VARCHAR(32) NOT NULL,
    actor_id    UUID NOT NULL REFERENCES users(id),
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE idea_embeddings (
    idea_id     UUID PRIMARY KEY REFERENCES ideas(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    embedding   vector(768) NOT NULL,
    model       VARCHAR(64) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_idea_embeddings_tenant ON idea_embeddings(tenant_id);
CREATE INDEX idx_idea_embeddings_vector ON idea_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
