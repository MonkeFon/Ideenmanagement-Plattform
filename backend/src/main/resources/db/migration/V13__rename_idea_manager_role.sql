-- Rename the role formerly called INNOVATION_MANAGER to IDEA_MANAGER.
-- users.role is plain varchar(32) (Hibernate @Enumerated(STRING)), so a value
-- update is sufficient — there is no native Postgres enum type to alter.
-- Runs after V3 (which now seeds IDEA_MANAGER directly): on a fresh DB this is a
-- no-op; on an existing DB it migrates the previously-seeded INNOVATION_MANAGER row.
UPDATE users SET role = 'IDEA_MANAGER' WHERE role = 'INNOVATION_MANAGER';
