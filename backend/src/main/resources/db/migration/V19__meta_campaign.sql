-- Meta-campaign: the Geistesblitz platform is itself a deliverable for the
-- university course "Projekt: Anwendungsentwicklung". This campaign represents
-- that project and collects ideas for evolving the platform beyond the hand-in.
--
-- Adds one campaign + two self-referential "expand this project" ideas (SUBMITTED),
-- with a few votes/comments. Embeddings are generated on boot by the
-- EmbeddingBootstrapper. Colour matches the project brand teal (#239F91).

INSERT INTO campaigns (id, tenant_id, name, description, color, starts_at, ends_at, created_by) VALUES
  ('dddddddd-0000-0000-0000-000000000005',
   '11111111-1111-1111-1111-111111111111',
   'Projekt: Anwendungsentwicklung',
   'Meta-Kampagne: Diese Plattform ist selbst ein Projekt im Hochschulkurs „Projekt: Anwendungsentwicklung". Hier sammeln wir Ideen, um Geistesblitz selbst weiterzuentwickeln – über den Funktionsumfang der Abgabe hinaus.',
   '#239F91',
   now() - interval '60 days', now() + interval '30 days',
   'aaaaaaaa-0000-0000-0000-000000000003');

INSERT INTO ideas (id, tenant_id, author_id, title, description, category, stage, sponsor_boost, priority_score, submitted_at, created_at, updated_at, campaign_id) VALUES
  ('ccccccc1-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003',
   'Echte Jira-Integration statt Mock-Anbindung',
   'Aktuell zeigt die Plattform einen Jira-ähnlichen Mock für Ideen in Umsetzung. Eine echte Anbindung über die Jira-REST-API würde bei der Genehmigung automatisch einen Vorgang anlegen und Status, Sprint und Story Points beidseitig synchronisieren – so entsteht eine durchgängige Brücke von der Idee bis zur Lieferung.',
   'Plattform', 'SUBMITTED', FALSE, NULL, now() - interval '5 days', now() - interval '5 days', now() - interval '5 days', 'dddddddd-0000-0000-0000-000000000005'),

  ('ccccccc1-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
   'E-Mail-Benachrichtigungen bei Workflow-Ereignissen',
   'Wer eine Idee eingereicht oder kommentiert hat, erfährt Statuswechsel bisher nur beim aktiven Öffnen der Plattform. Konfigurierbare E-Mail-Benachrichtigungen bei Phasenwechseln, neuen Kommentaren und Bewertungen würden die Beteiligung erhöhen und dafür sorgen, dass nichts mehr untergeht.',
   'Plattform', 'SUBMITTED', FALSE, NULL, now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', 'dddddddd-0000-0000-0000-000000000005');

-- Votes (the team likes both next-step ideas).
INSERT INTO votes (tenant_id, idea_id, user_id, value) VALUES
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000011','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000011','aaaaaaaa-0000-0000-0000-000000000004', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000011','aaaaaaaa-0000-0000-0000-000000000005', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000011','aaaaaaaa-0000-0000-0000-000000000006', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000012','aaaaaaaa-0000-0000-0000-000000000003', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000012','aaaaaaaa-0000-0000-0000-000000000004', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000012','aaaaaaaa-0000-0000-0000-000000000005', 1);

-- Comments.
INSERT INTO comments (tenant_id, idea_id, user_id, body, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000011','aaaaaaaa-0000-0000-0000-000000000005', 'Die Mock-Ansicht ist schon überzeugend – eine echte Anbindung wäre der logische nächste Schritt.', now() - interval '4 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000012','aaaaaaaa-0000-0000-0000-000000000003', 'Wichtig wäre, Benachrichtigungen pro Idee abonnieren und abbestellen zu können.', now() - interval '2 days');
