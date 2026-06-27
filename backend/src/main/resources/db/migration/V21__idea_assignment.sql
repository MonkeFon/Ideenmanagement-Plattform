-- Assignment pipeline for ideas.
--
-- Two pairs of optional user references on each idea:
--   preferred_*  — a suggestion made up front (typically by the submitter): "I'd
--                  like Jan to review this and Lifon to manage it." Non-binding.
--   assigned_*   — the actual pipeline assignment. Idea managers/admins set these;
--                  reviewers and idea managers can also claim the matching slot
--                  themselves (e.g. to accept a suggestion). These drive the
--                  "Meine Aufgaben" overview board for reviewers and idea managers.
--
-- All four are nullable and reference users(id). ON DELETE SET NULL so removing a
-- user doesn't orphan ideas — the slot simply falls back to unassigned.

ALTER TABLE ideas
    ADD COLUMN preferred_reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN preferred_manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN assigned_reviewer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN assigned_manager_id   UUID REFERENCES users(id) ON DELETE SET NULL;

-- The overview board filters ideas by "assigned to me", so index the two slots.
CREATE INDEX idx_ideas_assigned_reviewer ON ideas (assigned_reviewer_id);
CREATE INDEX idx_ideas_assigned_manager  ON ideas (assigned_manager_id);

-- ── Seed assignments for the demo dataset (FOM tenant) ───────────────────────
-- Idea manager Lifon (…0003) and reviewer Jan (…0004) are the only users with the
-- respective roles in the seed. We assign Lifon as manager on every idea that has
-- entered (or passed) the review pipeline, and Jan as reviewer on the same set, so
-- the default login (lifon, IDEA_MANAGER) opens onto a populated task board. Two
-- still-submitted ideas carry only *preferred* suggestions to demo the
-- "Für mich vorgeschlagen" → claim flow, and one under-review idea has a suggested
-- (not yet assigned) reviewer so Jan sees a pending suggestion too.

-- Assigned manager + reviewer on the in-pipeline ideas.
UPDATE ideas SET assigned_manager_id = 'aaaaaaaa-0000-0000-0000-000000000003',
                 assigned_reviewer_id = 'aaaaaaaa-0000-0000-0000-000000000004'
 WHERE id IN (
   'ccccccc1-0000-0000-0000-000000000001', -- I1 APPROVED
   'ccccccc1-0000-0000-0000-000000000002', -- I2 PRIORITIZATION
   'ccccccc1-0000-0000-0000-000000000004', -- I4 DONE
   'ccccccc1-0000-0000-0000-000000000005', -- I5 PRIORITIZATION
   'ccccccc1-0000-0000-0000-000000000007', -- I7 IN_IMPLEMENTATION
   'ccccccc1-0000-0000-0000-000000000008'  -- I8 UNDER_REVIEW
 );

-- I9 UNDER_REVIEW: manager assigned, reviewer only *suggested* (awaits Jan's claim).
UPDATE ideas SET assigned_manager_id  = 'aaaaaaaa-0000-0000-0000-000000000003',
                 preferred_reviewer_id = 'aaaaaaaa-0000-0000-0000-000000000004'
 WHERE id = 'ccccccc1-0000-0000-0000-000000000009';

-- Submitted ideas with up-front suggestions only (no assignment yet).
UPDATE ideas SET preferred_reviewer_id = 'aaaaaaaa-0000-0000-0000-000000000004',
                 preferred_manager_id  = 'aaaaaaaa-0000-0000-0000-000000000003'
 WHERE id IN (
   'ccccccc1-0000-0000-0000-000000000003', -- I3 SUBMITTED
   'ccccccc1-0000-0000-0000-000000000010'  -- I10 SUBMITTED
 );

-- I6 SUBMITTED: only a preferred manager suggested.
UPDATE ideas SET preferred_manager_id = 'aaaaaaaa-0000-0000-0000-000000000003'
 WHERE id = 'ccccccc1-0000-0000-0000-000000000006';
