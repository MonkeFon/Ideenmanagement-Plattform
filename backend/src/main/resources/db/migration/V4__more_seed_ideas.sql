-- Extra demo ideas, organised as four loose semantic clusters plus three outliers.
-- The clustering is intentional so the /graph view shows visible groups once embeddings are indexed.
-- All belong to the TestMandant tenant; authors are drawn from the seven seeded users.
--
-- Cluster 1 (Onboarding & training):     ccccccc2-...-001..003
-- Cluster 2 (Developer productivity):    ccccccc2-...-004..006
-- Cluster 3 (Customer feedback):         ccccccc2-...-007..009
-- Cluster 4 (Sustainability):            ccccccc2-...-010..012
-- Outliers:                              ccccccc2-...-013..015
--
-- The accompanying JSON file at scripts/seeds/extra-ideas.json mirrors this data
-- in a human-readable form for non-Flyway tooling (CI fixtures, manual imports, docs).

INSERT INTO ideas (id, tenant_id, author_id, title, description, category, stage, submitted_at) VALUES

-- Cluster 1: onboarding & training
('ccccccc2-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
 'Interactive onboarding playbooks for new hires',
 'New engineers spend their first two weeks reading scattered Confluence pages. A guided playbook that walks them through environment setup, first PR, and team rituals would cut ramp-up time and standardise the experience across teams.',
 'People', 'SUBMITTED', now() - interval '8 days'),

('ccccccc2-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
 'Buddy-system rotation for first 90 days',
 'Pair every new hire with a rotating buddy from a different team for the first three months. Encourages cross-team relationships early and gives newcomers a low-stakes channel for "dumb" questions outside their direct chain.',
 'People', 'UNDER_REVIEW', now() - interval '14 days'),

('ccccccc2-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003',
 'Self-paced training tracks per career ladder',
 'Curate per-role learning tracks (Junior → Senior → Staff) with video, hands-on labs, and assessments. Gives employees a clear development path without waiting for a manager 1:1 to surface gaps.',
 'People', 'PRIORITIZATION', now() - interval '22 days'),

-- Cluster 2: developer productivity / CI-CD
('ccccccc2-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
 'Faster CI by sharding tests intelligently',
 'Our CI pipeline takes 24 minutes because slow integration tests run sequentially. Shard them across N runners weighted by historical duration so total wall time drops to ~6 minutes for the same coverage.',
 'Engineering', 'APPROVED', now() - interval '30 days'),

('ccccccc2-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
 'Pre-merge ephemeral preview environments',
 'Spin up a per-PR preview environment with seeded data so reviewers (PMs and designers included) can click around the change before merge. Reduces "looks good, ship it" PRs that bite us in QA.',
 'Engineering', 'IN_IMPLEMENTATION', now() - interval '45 days'),

('ccccccc2-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003',
 'Local devbox with one-command bootstrap',
 'New engineers and infrastructure migrations both suffer from drift in dev environment setup scripts. Ship a single CLI that provisions a reproducible local dev environment (databases, queues, secrets) idempotently.',
 'Engineering', 'SUBMITTED', now() - interval '4 days'),

-- Cluster 3: customer feedback
('ccccccc2-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
 'In-product NPS with semantic clustering',
 'Post-feature NPS surveys generate hundreds of free-text comments nobody reads. Cluster responses by theme using embeddings and surface the top three themes weekly to the product team.',
 'Customer', 'UNDER_REVIEW', now() - interval '11 days'),

('ccccccc2-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
 'Customer support tickets to roadmap signals',
 'Every week support handles ~400 tickets, but only escalations reach product. Tag tickets automatically and feed an aggregated weekly digest to PMs so chronic friction shows up in roadmap planning.',
 'Customer', 'SUBMITTED', now() - interval '6 days'),

('ccccccc2-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004',
 'Closed-loop follow-up for negative survey responses',
 'When a customer leaves a low NPS score, route it to a CSM within 24 hours with the verbatim and account context. Closes the loop and surfaces churn risk earlier than the renewal call.',
 'Customer', 'PRIORITIZATION', now() - interval '18 days'),

-- Cluster 4: sustainability / energy
('ccccccc2-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
 'Carbon-aware batch job scheduling',
 'Move non-urgent batch workloads (analytics rebuilds, model training) to time windows when the grid carbon intensity is lowest. Could cut Scope 2 emissions by ~20% with no service degradation.',
 'Sustainability', 'SUBMITTED', now() - interval '3 days'),

('ccccccc2-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
 'Right-size idle dev environments overnight',
 'Most dev/staging clusters sit idle from 19:00 to 08:00 local time. Auto-scale them to zero outside working hours and restore on first request — cuts cloud spend and energy use without slowing anyone down.',
 'Sustainability', 'APPROVED', now() - interval '40 days'),

('ccccccc2-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002',
 'Green-build badge in the PR template',
 'Show the estimated CO2 cost of each CI run on the PR, with a leaderboard for the most efficient builds. Makes carbon a first-class engineering metric and nudges teams toward leaner pipelines.',
 'Sustainability', 'UNDER_REVIEW', now() - interval '16 days'),

-- Outliers (each in a distinct domain so they should sit alone in the graph)
('ccccccc2-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001',
 'Quarterly red-team exercise on prod auth flows',
 'Run a half-day exercise each quarter where a small internal red team tries to compromise our authentication and session management against staging. Findings feed directly into the security backlog.',
 'Security', 'PRIORITIZATION', now() - interval '25 days'),

('ccccccc2-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003',
 'Office hot-desk booking via Slack',
 'Replace the clunky room-booking web app with a Slack slash command for hot-desks: /desk book floor-3 tomorrow. Faster than the web UI and integrates with existing reminders.',
 'Office', 'DONE', now() - interval '90 days'),

('ccccccc2-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002',
 'Procurement transparency dashboard',
 'Finance approves software purchases over EUR 500 individually, but nobody sees the aggregate picture. Publish an internal dashboard of all SaaS subscriptions with owner, renewal date, and seat utilisation.',
 'Finance', 'SUBMITTED', now() - interval '9 days');
