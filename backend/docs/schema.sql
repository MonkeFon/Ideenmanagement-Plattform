-- =====================================================================
-- Ideenmanagement-Plattform — PostgreSQL Schema (Referenz)
-- Wird in der Anwendung automatisch via EF Core Migrationen erzeugt.
-- =====================================================================

CREATE TABLE users (
    id              uuid PRIMARY KEY,
    email           varchar(256) NOT NULL,
    user_name       varchar(100) NOT NULL,
    password_hash   text         NOT NULL,
    first_name      varchar(100) NOT NULL,
    last_name       varchar(100) NOT NULL,
    is_active       boolean      NOT NULL DEFAULT TRUE,
    last_login_at   timestamptz  NULL,
    created_at      timestamptz  NOT NULL,
    updated_at      timestamptz  NULL,
    created_by      uuid         NULL,
    updated_by      uuid         NULL,
    is_deleted      boolean      NOT NULL DEFAULT FALSE,
    deleted_at      timestamptz  NULL
);
CREATE UNIQUE INDEX ux_users_email     ON users (email);
CREATE UNIQUE INDEX ux_users_user_name ON users (user_name);
CREATE INDEX ix_users_is_deleted        ON users (is_deleted);

CREATE TABLE roles (
    id          uuid PRIMARY KEY,
    name        varchar(100) NOT NULL,
    description varchar(500) NULL,
    created_at  timestamptz  NOT NULL,
    updated_at  timestamptz  NULL,
    created_by  uuid NULL,
    updated_by  uuid NULL
);
CREATE UNIQUE INDEX ux_roles_name ON roles (name);

CREATE TABLE permissions (
    id          uuid PRIMARY KEY,
    code        varchar(100) NOT NULL,
    description varchar(500) NULL,
    created_at  timestamptz  NOT NULL,
    updated_at  timestamptz  NULL,
    created_by  uuid NULL,
    updated_by  uuid NULL
);
CREATE UNIQUE INDEX ux_permissions_code ON permissions (code);

CREATE TABLE user_roles (
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE idea_categories (
    id          uuid PRIMARY KEY,
    name        varchar(100) NOT NULL,
    description varchar(500) NULL,
    is_active   boolean NOT NULL DEFAULT TRUE,
    created_at  timestamptz NOT NULL,
    updated_at  timestamptz NULL,
    created_by  uuid NULL,
    updated_by  uuid NULL,
    is_deleted  boolean NOT NULL DEFAULT FALSE,
    deleted_at  timestamptz NULL
);
CREATE UNIQUE INDEX ux_idea_categories_name ON idea_categories (name);

CREATE TABLE ideas (
    id               uuid PRIMARY KEY,
    title            varchar(150)  NOT NULL,
    description      varchar(10000) NOT NULL,
    status           integer       NOT NULL,
    author_id        uuid          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id      uuid          NOT NULL REFERENCES idea_categories(id) ON DELETE RESTRICT,
    approved_by_id   uuid          NULL REFERENCES users(id) ON DELETE SET NULL,
    approved_at      timestamptz   NULL,
    rejected_reason  varchar(1000) NULL,
    view_count       integer       NOT NULL DEFAULT 0,
    created_at       timestamptz   NOT NULL,
    updated_at       timestamptz   NULL,
    created_by       uuid          NULL,
    updated_by       uuid          NULL,
    is_deleted       boolean       NOT NULL DEFAULT FALSE,
    deleted_at       timestamptz   NULL
);
CREATE INDEX ix_ideas_status      ON ideas (status);
CREATE INDEX ix_ideas_category_id ON ideas (category_id);
CREATE INDEX ix_ideas_author_id   ON ideas (author_id);
CREATE INDEX ix_ideas_created_at  ON ideas (created_at);

CREATE TABLE idea_comments (
    id                uuid PRIMARY KEY,
    idea_id           uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    author_id         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    parent_comment_id uuid NULL REFERENCES idea_comments(id) ON DELETE RESTRICT,
    content           varchar(2000) NOT NULL,
    created_at        timestamptz NOT NULL,
    updated_at        timestamptz NULL,
    created_by        uuid NULL,
    updated_by        uuid NULL,
    is_deleted        boolean NOT NULL DEFAULT FALSE,
    deleted_at        timestamptz NULL
);
CREATE INDEX ix_idea_comments_idea_id ON idea_comments (idea_id);

CREATE TABLE idea_votes (
    id         uuid PRIMARY KEY,
    idea_id    uuid     NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id    uuid     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type  smallint NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NULL,
    created_by uuid NULL,
    updated_by uuid NULL
);
CREATE UNIQUE INDEX ux_idea_votes_idea_user ON idea_votes (idea_id, user_id);

CREATE TABLE attachments (
    id               uuid PRIMARY KEY,
    idea_id          uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    file_name        varchar(260) NOT NULL,
    content_type     varchar(150) NOT NULL,
    size_bytes       bigint NOT NULL,
    storage_path     varchar(500) NOT NULL,
    uploaded_by_id   uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at       timestamptz NOT NULL,
    updated_at       timestamptz NULL,
    created_by       uuid NULL,
    updated_by       uuid NULL,
    is_deleted       boolean NOT NULL DEFAULT FALSE,
    deleted_at       timestamptz NULL
);

CREATE TABLE notifications (
    id            uuid PRIMARY KEY,
    user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          integer NOT NULL,
    title         varchar(200) NOT NULL,
    message       varchar(2000) NOT NULL,
    is_read       boolean NOT NULL DEFAULT FALSE,
    read_at       timestamptz NULL,
    reference_id  uuid NULL,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz NULL,
    created_by    uuid NULL,
    updated_by    uuid NULL
);
CREATE INDEX ix_notifications_user_read ON notifications (user_id, is_read);

CREATE TABLE audit_logs (
    id               uuid PRIMARY KEY,
    user_id          uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    action           integer NOT NULL,
    entity_name      varchar(150) NOT NULL,
    entity_id        varchar(100) NULL,
    old_values_json  jsonb NULL,
    new_values_json  jsonb NULL,
    ip_address       varchar(64) NULL,
    user_agent       varchar(500) NULL,
    timestamp        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_entity     ON audit_logs (entity_name, entity_id);
CREATE INDEX ix_audit_logs_timestamp  ON audit_logs (timestamp);

CREATE TABLE refresh_tokens (
    id                     uuid PRIMARY KEY,
    user_id                uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash             varchar(256) NOT NULL,
    expires_at             timestamptz  NOT NULL,
    created_at             timestamptz  NOT NULL,
    created_by_ip          varchar(64) NULL,
    revoked_at             timestamptz NULL,
    revoked_by_ip          varchar(64) NULL,
    replaced_by_token_hash varchar(256) NULL
);
CREATE UNIQUE INDEX ux_refresh_tokens_hash    ON refresh_tokens (token_hash);
CREATE INDEX        ix_refresh_tokens_user_id ON refresh_tokens (user_id);

