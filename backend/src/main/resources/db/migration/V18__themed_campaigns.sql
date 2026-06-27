-- Align the campaigns with the curated ten-idea dataset (see V17).
--
-- After V17 only "Engineering-Velocity 2026" still made thematic sense; the other
-- seeded campaigns (Q3 Kundenbindung, Nachhaltigkeits-Roadmap) and the ad-hoc
-- "Prototyp für Projektanwendungsentwicklung" had no ideas and were off-topic for a
-- software-engineering / DevOps / security / convenience demo.
--
-- Result: two coherent, themed campaigns —
--   • Engineering-Velocity 2026  → software-engineering + DevOps ideas
--   • Security-Hardening 2026     → security ideas
-- The single convenience idea (Self-Service-Portal) stays unlinked.
--
-- Deleting a campaign nulls campaign_id on any linked ideas (ON DELETE SET NULL),
-- so no idea is lost. The Prototyp delete is a no-op on a freshly migrated DB
-- (that campaign was only ever created at runtime in the live database).

-- New security campaign (created by Lifon, the Ideenmanager).
INSERT INTO campaigns (id, tenant_id, name, description, color, starts_at, ends_at, created_by) VALUES
  ('dddddddd-0000-0000-0000-000000000004',
   '11111111-1111-1111-1111-111111111111',
   'Security-Hardening 2026',
   'Systematische Härtung unserer Anwendungen und Lieferkette: automatisierte Schwachstellen-Scans, starke Authentifizierung und sichere Verwaltung von Geheimnissen. Ziel ist es, Sicherheitsrisiken früh in der Pipeline zu erkennen und zu beheben.',
   '#e11d48',
   now() - interval '20 days', now() + interval '120 days',
   'aaaaaaaa-0000-0000-0000-000000000003');

-- Re-bucket ideas into the two themed campaigns.
-- API-Dokumentation joins the engineering campaign.
UPDATE ideas SET campaign_id = 'dddddddd-0000-0000-0000-000000000002'
 WHERE id = 'ccccccc1-0000-0000-0000-000000000003';
-- The three security ideas move to the security campaign
-- (dependency scan was previously under Engineering-Velocity).
UPDATE ideas SET campaign_id = 'dddddddd-0000-0000-0000-000000000004'
 WHERE id IN ('ccccccc1-0000-0000-0000-000000000007',   -- Abhängigkeits-Scan
              'ccccccc1-0000-0000-0000-000000000008',   -- 2FA
              'ccccccc1-0000-0000-0000-000000000009');  -- Secret-Tresor

-- Drop the off-theme / empty campaigns.
DELETE FROM campaigns WHERE id IN (
  'dddddddd-0000-0000-0000-000000000001',          -- Q3 Kundenbindung
  'dddddddd-0000-0000-0000-000000000003',          -- Nachhaltigkeits-Roadmap
  'a49d2be5-a570-4bda-b16d-a9ff70f72cc0'           -- Prototyp (runtime-created; no-op on fresh DB)
);
