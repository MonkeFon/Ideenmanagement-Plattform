-- Demo data: two tenants, one user per role, a handful of ideas.
-- Password hash below is BCrypt for "demo1234" (cost 10).
-- Generated once; keep stable so tests / docs stay valid.

WITH pro AS (SELECT id FROM plans WHERE code = 'PRO'),
     free AS (SELECT id FROM plans WHERE code = 'FREE')
INSERT INTO tenants (id, name, slug, plan_id, plan_expires_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'TestMandant', 'testmandant', (SELECT id FROM pro),  now() + interval '365 days'),
    ('22222222-2222-2222-2222-222222222222', 'Globex', 'globex', (SELECT id FROM free), now() + interval '365 days');

INSERT INTO users (id, tenant_id, email, display_name, password_hash, role) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'admin@testmandant.test',    'Ada Admin',     '$2a$10$3a7yV3Q3O1bV2y8u4yPM2.Pe7VYbY0PqL/SnvT5gIDXg.dnLJgkOC', 'ADMIN'),
    ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'sponsor@testmandant.test',  'Sven Sponsor',  '$2a$10$3a7yV3Q3O1bV2y8u4yPM2.Pe7VYbY0PqL/SnvT5gIDXg.dnLJgkOC', 'SPONSOR'),
    ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'manager@testmandant.test',  'Mira Manager',  '$2a$10$3a7yV3Q3O1bV2y8u4yPM2.Pe7VYbY0PqL/SnvT5gIDXg.dnLJgkOC', 'INNOVATION_MANAGER'),
    ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'reviewer@testmandant.test', 'Rob Reviewer',  '$2a$10$3a7yV3Q3O1bV2y8u4yPM2.Pe7VYbY0PqL/SnvT5gIDXg.dnLJgkOC', 'REVIEWER'),
    ('aaaaaaaa-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'alice@testmandant.test',    'Alice Employee','$2a$10$3a7yV3Q3O1bV2y8u4yPM2.Pe7VYbY0PqL/SnvT5gIDXg.dnLJgkOC', 'EMPLOYEE'),
    ('aaaaaaaa-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'bob@testmandant.test',      'Bob Employee',  '$2a$10$3a7yV3Q3O1bV2y8u4yPM2.Pe7VYbY0PqL/SnvT5gIDXg.dnLJgkOC', 'EMPLOYEE'),
    ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'owner@globex.test',  'Glo Owner',     '$2a$10$3a7yV3Q3O1bV2y8u4yPM2.Pe7VYbY0PqL/SnvT5gIDXg.dnLJgkOC', 'ADMIN');

INSERT INTO ideas (id, tenant_id, author_id, title, description, category, stage, submitted_at) VALUES
    ('ccccccc1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
     'Auto-categorise expense receipts with OCR',
     'Most employees waste 15 minutes per expense report manually entering line items from PDF receipts. We could integrate an OCR step that pre-fills the form and only asks the human to confirm.',
     'Productivity', 'SUBMITTED', now() - interval '5 days'),
    ('ccccccc1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
     'Cross-team OKR alignment dashboard',
     'Teams duplicate work because nobody can see overlapping OKRs across departments. A read-only dashboard surfacing all OKRs with semantic similarity would help leadership spot duplication and gaps.',
     'Strategy', 'UNDER_REVIEW', now() - interval '12 days'),
    ('ccccccc1-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
     'Mentor matching based on skill graphs',
     'Junior engineers struggle to find mentors with the right specialty. Match using a skill graph derived from internal docs and project tags.',
     'People', 'SUBMITTED', now() - interval '2 days'),
    ('ccccccc1-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
     'Self-service data quality dashboards',
     'Data consumers do not trust core tables because freshness and null-rate metrics live in a separate Slack channel. Surface them inline in the BI tool.',
     'Data', 'PRIORITIZATION', now() - interval '20 days');

INSERT INTO votes (tenant_id, idea_id, user_id, value) VALUES
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000006',  1),
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003',  1),
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000005',  1),
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000004',  1),
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000005',  1),
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000006',  1),
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000003',  1);

INSERT INTO evaluations (tenant_id, idea_id, reviewer_id, impact, feasibility, strategic_fit, notes) VALUES
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000004', 4, 3, 5, 'Strong fit with the Q3 strategy theme.'),
    ('11111111-1111-1111-1111-111111111111', 'ccccccc1-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004', 5, 4, 4, 'High impact; existing tooling makes it feasible.');
