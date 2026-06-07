-- Campaigns: tenant-scoped groupings of ideas around a theme or initiative.
-- An idea may optionally belong to one campaign; deleting a campaign nulls the FK
-- on its ideas rather than removing them.

CREATE TABLE campaigns (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name         VARCHAR(120) NOT NULL,
    description  TEXT NOT NULL,
    color        VARCHAR(16) NOT NULL DEFAULT '#6366f1',
    starts_at    TIMESTAMPTZ,
    ends_at      TIMESTAMPTZ,
    created_by   UUID NOT NULL REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);
CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);

ALTER TABLE ideas ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX idx_ideas_campaign ON ideas(campaign_id);

-- Seed three campaigns for TestMandant that map onto the semantic clusters already in V4
-- so the graph view, leaderboard, and campaign detail page all tell a consistent story.

INSERT INTO campaigns (id, tenant_id, name, description, color, starts_at, ends_at, created_by) VALUES
    ('dddddddd-0000-0000-0000-000000000001',
     '11111111-1111-1111-1111-111111111111',
     'Q3 Customer Retention',
     'Reduce churn through tighter feedback loops and faster signal-to-roadmap turnaround. We want to ship at least two of the approved ideas under this campaign before the end of Q3.',
     '#0891b2',
     now() - interval '14 days', now() + interval '76 days',
     'aaaaaaaa-0000-0000-0000-000000000001'),

    ('dddddddd-0000-0000-0000-000000000002',
     '11111111-1111-1111-1111-111111111111',
     'Engineering Velocity 2026',
     'Cut the mean lead time from PR to production by 40% over the next two quarters. Focused on CI, preview environments, and local dev ergonomics.',
     '#6366f1',
     now() - interval '30 days', now() + interval '150 days',
     'aaaaaaaa-0000-0000-0000-000000000003'),

    ('dddddddd-0000-0000-0000-000000000003',
     '11111111-1111-1111-1111-111111111111',
     'Sustainability Roadmap',
     'Cross-functional initiative to make our Scope 2 emissions and cloud spend a tracked metric, then act on the biggest levers.',
     '#10b981',
     now() - interval '7 days', NULL,
     'aaaaaaaa-0000-0000-0000-000000000002');

-- Link the V4 seeded ideas to their natural campaigns.

UPDATE ideas SET campaign_id = 'dddddddd-0000-0000-0000-000000000001'
 WHERE id IN ('ccccccc2-0000-0000-0000-000000000007',
              'ccccccc2-0000-0000-0000-000000000008',
              'ccccccc2-0000-0000-0000-000000000009');

UPDATE ideas SET campaign_id = 'dddddddd-0000-0000-0000-000000000002'
 WHERE id IN ('ccccccc2-0000-0000-0000-000000000004',
              'ccccccc2-0000-0000-0000-000000000005',
              'ccccccc2-0000-0000-0000-000000000006');

UPDATE ideas SET campaign_id = 'dddddddd-0000-0000-0000-000000000003'
 WHERE id IN ('ccccccc2-0000-0000-0000-000000000010',
              'ccccccc2-0000-0000-0000-000000000011',
              'ccccccc2-0000-0000-0000-000000000012');
