-- Curate the demo dataset down to ten focused, easy-to-grasp ideas (German),
-- centred on software engineering, DevOps, security and convenience.
--
-- Earlier migrations (V3/V4/V6/V10) built up a larger, mixed-topic set. For the
-- demo we want a small, coherent board where every idea is instantly
-- understandable and the stages are nicely spread (incl. one IN_IMPLEMENTATION
-- and one DONE so the Jira delivery hand-off is demoable).
--
-- We clear ALL ideas first; the ON DELETE CASCADE on votes/comments/evaluations/
-- workflow_history/idea_embeddings cleans up every dependent row. Embeddings are
-- NOT seeded here — the on-boot EmbeddingBootstrapper re-indexes the ten ideas via
-- the configured provider (Ollama) on the next start.
--
-- User and tenant UUIDs are the stable ids from V3 (emails were renamed in V14,
-- ids never changed). Historical records (votes/evaluations/workflow_history)
-- reference users by id regardless of their current role.

DELETE FROM ideas;

-- ── The ten ideas ───────────────────────────────────────────────────────────
-- author ids: U1 timo …0001, U2 michael …0002, U3 lifon …0003,
--             U4 jan …0004, U5 michel …0005, U6 hayao …0006
-- campaign EV = Engineering-Velocity 2026 (dddddddd-0000-0000-0000-000000000002)
INSERT INTO ideas (id, tenant_id, author_id, title, description, category, stage, sponsor_boost, priority_score, submitted_at, created_at, updated_at, campaign_id) VALUES
  ('ccccccc1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004',
   'Einheitliche Code-Review-Checkliste im Pull-Request',
   'Code-Reviews laufen heute je nach Prüfer sehr unterschiedlich ab. Eine verbindliche Checkliste direkt im Pull-Request-Template (Tests, Fehlerbehandlung, Sicherheit, Dokumentation) sorgt für gleichbleibende Qualität und schnellere Reviews. Neue Teammitglieder finden sich dadurch deutlich leichter ein.',
   'Software Engineering', 'APPROVED', TRUE, 0.78, now() - interval '30 days', now() - interval '30 days', now() - interval '20 days', 'dddddddd-0000-0000-0000-000000000002'),

  ('ccccccc1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002',
   'Gemeinsame Bibliothek für Logging und Fehlerbehandlung',
   'Jeder Dienst implementiert Logging und Fehlerbehandlung etwas anders, was die Fehlersuche über Systemgrenzen hinweg erschwert. Eine gemeinsame Bibliothek mit einheitlichem Log-Format und zentraler Fehlerstruktur vereinfacht die Wartung und erhöht die Aussagekraft der Logs.',
   'Software Engineering', 'PRIORITIZATION', FALSE, 0.64, now() - interval '22 days', now() - interval '22 days', now() - interval '16 days', 'dddddddd-0000-0000-0000-000000000002'),

  ('ccccccc1-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
   'API-Dokumentation automatisch aus dem Code erzeugen',
   'Unsere API-Dokumentation veraltet schnell, weil sie manuell gepflegt wird. Wenn wir sie per OpenAPI direkt aus den Controllern generieren und im CI veröffentlichen, ist sie immer aktuell und für andere Teams sofort nutzbar.',
   'Software Engineering', 'SUBMITTED', FALSE, NULL, now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', NULL),

  ('ccccccc1-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003',
   'Ein-Klick-Entwicklungsumgebung mit Docker Compose',
   'Das Aufsetzen einer lokalen Umgebung kostet neue Entwickler oft einen ganzen Tag. Mit einem einzigen Befehl starten Datenbank, Backend und Frontend reproduzierbar über Docker Compose. Das verkürzt das Onboarding spürbar und reduziert "Bei mir läuft es"-Probleme.',
   'DevOps', 'DONE', FALSE, 0.72, now() - interval '40 days', now() - interval '40 days', now() - interval '7 days', 'dddddddd-0000-0000-0000-000000000002'),

  ('ccccccc1-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004',
   'Automatische Vorschau-Umgebung pro Pull-Request',
   'Reviewer müssen Änderungen heute lokal auschecken, um sie auszuprobieren. Eine automatisch erzeugte, temporäre Vorschau-Umgebung pro Pull-Request macht Änderungen sofort per Link testbar — für Entwicklung, QA und Fachbereich gleichermaßen.',
   'DevOps', 'PRIORITIZATION', FALSE, 0.60, now() - interval '18 days', now() - interval '18 days', now() - interval '12 days', 'dddddddd-0000-0000-0000-000000000002'),

  ('ccccccc1-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Zentrales Dashboard für Build- und Deployment-Status',
   'Der Status von Builds und Deployments ist über mehrere Werkzeuge verstreut. Ein zentrales Dashboard zeigt auf einen Blick, welche Version wo läuft und ob eine Pipeline fehlgeschlagen ist. Das spart Suchzeit und macht Störungen schneller sichtbar.',
   'DevOps', 'SUBMITTED', FALSE, NULL, now() - interval '4 days', now() - interval '4 days', now() - interval '4 days', 'dddddddd-0000-0000-0000-000000000002'),

  ('ccccccc1-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
   'Abhängigkeiten automatisch auf Sicherheitslücken prüfen',
   'Veraltete Bibliotheken sind ein häufiges Einfallstor für Angriffe. Ein automatischer Scan der Abhängigkeiten (z. B. Trivy oder Dependabot) direkt in der CI-Pipeline meldet bekannte Schwachstellen sofort und blockiert kritische Funde vor dem Merge.',
   'Sicherheit', 'IN_IMPLEMENTATION', TRUE, 0.81, now() - interval '26 days', now() - interval '26 days', now() - interval '10 days', 'dddddddd-0000-0000-0000-000000000002'),

  ('ccccccc1-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002',
   'Zwei-Faktor-Authentifizierung für interne Werkzeuge',
   'Interne Werkzeuge sind bislang nur mit Passwort geschützt. Eine verpflichtende Zwei-Faktor-Authentifizierung über unseren bestehenden Single-Sign-On erhöht den Schutz sensibler Daten deutlich, ohne den Anmeldeprozess spürbar zu verlangsamen.',
   'Sicherheit', 'UNDER_REVIEW', FALSE, NULL, now() - interval '10 days', now() - interval '10 days', now() - interval '8 days', NULL),

  ('ccccccc1-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Secrets aus dem Code in einen zentralen Tresor auslagern',
   'Zugangsdaten und API-Schlüssel liegen teils noch in Konfigurationsdateien im Repository. Ein zentraler Secret-Tresor (z. B. Vault) mit rollenbasiertem Zugriff verhindert versehentliche Lecks und erleichtert das regelmäßige Rotieren von Schlüsseln.',
   'Sicherheit', 'UNDER_REVIEW', FALSE, NULL, now() - interval '9 days', now() - interval '9 days', now() - interval '7 days', NULL),

  ('ccccccc1-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
   'Self-Service-Portal für Zugriffsanfragen',
   'Zugriffsanfragen laufen heute über E-Mails und dauern oft Tage. Ein Self-Service-Portal mit klaren Genehmigungsschritten lässt Mitarbeitende Berechtigungen selbst beantragen und nachverfolgen — schneller für die Antragsteller und transparenter für die Genehmigenden.',
   'Komfort', 'SUBMITTED', FALSE, NULL, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', NULL);

-- ── Votes (one per user per idea; net values range 1..5) ─────────────────────
INSERT INTO votes (tenant_id, idea_id, user_id, value) VALUES
  -- I1 +5
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000005', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000006', 1),
  -- I2 +3 (4 up, 1 down)
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000003', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000004', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000005', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000006',-1),
  -- I3 +2
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000004', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000005', 1),
  -- I4 +5
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000002', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000004', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000005', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000006', 1),
  -- I5 +4
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000003', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000005', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000006', 1),
  -- I6 +2
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000005', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000006', 1),
  -- I7 +5
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000002', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000003', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000004', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000006', 1),
  -- I8 +3
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000003', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000004', 1),
  -- I9 +1 (2 up, 1 down)
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000002', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000003', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000005',-1),
  -- I10 +3
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000004', 1),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000005', 1);

-- ── Evaluations (reviewers Jan …0004 and Michael …0002) ──────────────────────
INSERT INTO evaluations (tenant_id, idea_id, reviewer_id, impact, feasibility, strategic_fit, notes) VALUES
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000004', 5, 4, 5, 'Hoher Nutzen bei geringem Aufwand.'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002', 4, 4, 4, 'Standardisierung tut dem Team gut.'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000004', 3, 3, 4, 'Sinnvoll, aber Migrationsaufwand der Bestandsdienste beachten.'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000004', 5, 5, 4, 'Funktioniert bereits hervorragend.'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000002', 5, 4, 5, 'Spürbar kürzeres Onboarding.'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000004', 4, 3, 4, 'Großer Mehrwert für Reviews.'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000004', 5, 4, 5, 'Klarer Sicherheitsgewinn, gut machbar.'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000002', 4, 5, 4, 'Sollte Pflicht in jeder Pipeline werden.');

-- ── Comments ─────────────────────────────────────────────────────────────────
INSERT INTO comments (tenant_id, idea_id, user_id, body, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003', 'Bitte die Checkliste schlank halten – sonst wird sie beim Review übersprungen.', now() - interval '27 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002', 'Einverstanden. Der Punkt Sicherheit sollte verpflichtend sein.', now() - interval '26 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000006', 'Hat mein Onboarding von zwei Tagen auf wenige Stunden verkürzt. Danke!', now() - interval '6 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000004', 'Wichtig: kritische Funde sollten den Merge blockieren, nicht nur warnen.', now() - interval '19 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000005', 'Genau so umgesetzt – der Schwellwert steht auf ''hoch''.', now() - interval '9 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000003', 'Bitte den bestehenden Single-Sign-On nutzen, kein zweites Login-System.', now() - interval '7 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000005', 'Eine Übersicht über bereits erteilte Zugriffe wäre super.', now() - interval '1 days');

-- ── Workflow history (actor Lifon …0003, IDEA_MANAGER) ───────────────────────
INSERT INTO workflow_history (tenant_id, idea_id, from_stage, to_stage, actor_id, reason, created_at) VALUES
  -- I1 → APPROVED
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','SUBMITTED','UNDER_REVIEW','aaaaaaaa-0000-0000-0000-000000000003','In Prüfung genommen.', now() - interval '28 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','UNDER_REVIEW','PRIORITIZATION','aaaaaaaa-0000-0000-0000-000000000003','Bewertungen liegen vor, zur Priorisierung.', now() - interval '24 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000001','PRIORITIZATION','APPROVED','aaaaaaaa-0000-0000-0000-000000000003','Genehmigt – wird eingeplant.', now() - interval '20 days'),
  -- I2 → PRIORITIZATION
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','SUBMITTED','UNDER_REVIEW','aaaaaaaa-0000-0000-0000-000000000003','In Prüfung genommen.', now() - interval '20 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000002','UNDER_REVIEW','PRIORITIZATION','aaaaaaaa-0000-0000-0000-000000000003','Zur Priorisierung.', now() - interval '16 days'),
  -- I4 → DONE
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','SUBMITTED','UNDER_REVIEW','aaaaaaaa-0000-0000-0000-000000000003','In Prüfung genommen.', now() - interval '38 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','UNDER_REVIEW','PRIORITIZATION','aaaaaaaa-0000-0000-0000-000000000003','Zur Priorisierung.', now() - interval '34 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','PRIORITIZATION','APPROVED','aaaaaaaa-0000-0000-0000-000000000003','Genehmigt.', now() - interval '30 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','APPROVED','IN_IMPLEMENTATION','aaaaaaaa-0000-0000-0000-000000000003','Umsetzung gestartet.', now() - interval '24 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000004','IN_IMPLEMENTATION','DONE','aaaaaaaa-0000-0000-0000-000000000003','Ausgerollt und abgeschlossen.', now() - interval '7 days'),
  -- I5 → PRIORITIZATION
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000005','SUBMITTED','UNDER_REVIEW','aaaaaaaa-0000-0000-0000-000000000003','In Prüfung genommen.', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000005','UNDER_REVIEW','PRIORITIZATION','aaaaaaaa-0000-0000-0000-000000000003','Zur Priorisierung.', now() - interval '12 days'),
  -- I7 → IN_IMPLEMENTATION
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','SUBMITTED','UNDER_REVIEW','aaaaaaaa-0000-0000-0000-000000000003','In Prüfung genommen.', now() - interval '24 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','UNDER_REVIEW','PRIORITIZATION','aaaaaaaa-0000-0000-0000-000000000003','Zur Priorisierung.', now() - interval '20 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','PRIORITIZATION','APPROVED','aaaaaaaa-0000-0000-0000-000000000003','Genehmigt.', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000007','APPROVED','IN_IMPLEMENTATION','aaaaaaaa-0000-0000-0000-000000000003','Umsetzung gestartet.', now() - interval '10 days'),
  -- I8 → UNDER_REVIEW
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000008','SUBMITTED','UNDER_REVIEW','aaaaaaaa-0000-0000-0000-000000000003','In Prüfung genommen.', now() - interval '8 days'),
  -- I9 → UNDER_REVIEW
  ('11111111-1111-1111-1111-111111111111','ccccccc1-0000-0000-0000-000000000009','SUBMITTED','UNDER_REVIEW','aaaaaaaa-0000-0000-0000-000000000003','In Prüfung genommen.', now() - interval '7 days');
