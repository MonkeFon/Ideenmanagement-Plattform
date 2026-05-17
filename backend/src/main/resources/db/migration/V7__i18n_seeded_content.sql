-- Add German translation columns alongside the existing English seed data,
-- so the UI can switch between datasets via the X-Content-Lang header.
-- When the column is NULL the backend falls back to the original English text,
-- so user-submitted ideas (which only fill the EN columns) keep working unchanged.

ALTER TABLE ideas
    ADD COLUMN title_de       VARCHAR(200),
    ADD COLUMN description_de TEXT;

ALTER TABLE campaigns
    ADD COLUMN name_de         VARCHAR(120),
    ADD COLUMN description_de  TEXT;

-- ============================================================
-- V3 seed (4 ideas)
-- ============================================================

UPDATE ideas SET
    title_de = 'Spesenbelege per OCR automatisch kategorisieren',
    description_de = 'Die meisten Mitarbeitenden vergeuden 15 Minuten pro Spesenabrechnung damit, Posten aus PDF-Belegen abzutippen. Wir könnten einen OCR-Schritt einbauen, der das Formular vorausfüllt und den Menschen nur noch um Bestätigung bittet.'
WHERE id = 'ccccccc1-0000-0000-0000-000000000001';

UPDATE ideas SET
    title_de = 'Teamübergreifendes OKR-Alignment-Dashboard',
    description_de = 'Teams machen sich gegenseitig Arbeit, weil niemand überlappende OKRs zwischen Abteilungen sieht. Ein nur-lesendes Dashboard, das alle OKRs mit semantischer Ähnlichkeit sichtbar macht, hilft der Führung, Doppelarbeit und Lücken zu erkennen.'
WHERE id = 'ccccccc1-0000-0000-0000-000000000002';

UPDATE ideas SET
    title_de = 'Mentor-Matching auf Basis von Skill-Graphen',
    description_de = 'Junior-Engineers tun sich schwer, Mentoren mit der passenden Spezialisierung zu finden. Matching über einen Skill-Graphen, der aus internen Dokumenten und Projekt-Tags abgeleitet wird.'
WHERE id = 'ccccccc1-0000-0000-0000-000000000003';

UPDATE ideas SET
    title_de = 'Self-Service-Dashboards zur Datenqualität',
    description_de = 'Daten-Konsumenten vertrauen den Kerntabellen nicht, weil Aktualität und Null-Quoten in einem separaten Slack-Kanal leben. Diese Metriken direkt im BI-Tool sichtbar machen.'
WHERE id = 'ccccccc1-0000-0000-0000-000000000004';

-- ============================================================
-- V4 seed (15 ideas)
-- ============================================================

-- Cluster 1: Onboarding & Schulung
UPDATE ideas SET
    title_de = 'Interaktive Onboarding-Playbooks für neue Mitarbeitende',
    description_de = 'Neue Engineers verbringen ihre ersten zwei Wochen damit, verstreute Confluence-Seiten zu lesen. Ein geführtes Playbook, das sie durch Setup, ersten PR und Team-Rituale leitet, würde die Einarbeitungszeit verkürzen und das Erlebnis über Teams hinweg vereinheitlichen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000001';

UPDATE ideas SET
    title_de = 'Buddy-System-Rotation in den ersten 90 Tagen',
    description_de = 'Jede neue Person für die ersten drei Monate mit einem rotierenden Buddy aus einem anderen Team koppeln. Fördert teamübergreifende Beziehungen früh und gibt Neulingen einen niedrigschwelligen Kanal für „dumme" Fragen außerhalb der direkten Linie.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000002';

UPDATE ideas SET
    title_de = 'Selbstgesteuerte Lernpfade pro Karrierestufe',
    description_de = 'Kuratiert Lernpfade pro Rolle (Junior → Senior → Staff) mit Video, Hands-on-Labs und Wissenstests. Gibt Mitarbeitenden einen klaren Entwicklungsweg, ohne auf das nächste Manager-1:1 warten zu müssen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000003';

-- Cluster 2: Entwicklerproduktivität / CI-CD
UPDATE ideas SET
    title_de = 'Schnellere CI durch intelligentes Test-Sharding',
    description_de = 'Unsere CI-Pipeline braucht 24 Minuten, weil langsame Integrationstests sequenziell laufen. Verteilt sie auf N Runner gewichtet nach historischer Dauer — Wall-Time fällt auf ~6 Minuten bei gleicher Abdeckung.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000004';

UPDATE ideas SET
    title_de = 'Ephemere Preview-Environments vor dem Merge',
    description_de = 'Startet pro PR ein Preview-Environment mit Seed-Daten, damit Reviewer (inkl. PMs und Designer) die Änderung vor dem Merge ausprobieren können. Reduziert „sieht gut aus, shippen"-PRs, die uns später in QA beißen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000005';

UPDATE ideas SET
    title_de = 'Lokale Devbox mit Ein-Befehl-Bootstrap',
    description_de = 'Neue Engineers und Infrastruktur-Migrationen leiden beide unter Drift in Dev-Environment-Skripten. Liefert ein einziges CLI, das ein reproduzierbares lokales Dev-Setup (Datenbanken, Queues, Secrets) idempotent provisioniert.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000006';

-- Cluster 3: Kundenfeedback
UPDATE ideas SET
    title_de = 'In-Product NPS mit semantischem Clustering',
    description_de = 'NPS-Umfragen nach Features erzeugen Hunderte Freitext-Kommentare, die niemand liest. Antworten per Embeddings nach Thema clustern und die Top-3-Themen wöchentlich an das Produktteam ausspielen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000007';

UPDATE ideas SET
    title_de = 'Support-Tickets als Roadmap-Signale',
    description_de = 'Pro Woche bearbeitet Support ~400 Tickets, aber nur Eskalationen erreichen das Produkt. Tickets automatisch taggen und PMs einen aggregierten Wochen-Digest schicken, damit chronische Reibungspunkte in der Roadmap auftauchen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000008';

UPDATE ideas SET
    title_de = 'Closed-Loop-Nachverfolgung negativer Umfrage-Antworten',
    description_de = 'Wenn ein Kunde eine niedrige NPS-Bewertung abgibt, innerhalb von 24 Stunden an einen CSM weiterleiten — mit Wortlaut und Account-Kontext. Schließt die Schleife und macht Churn-Risiken früher sichtbar als beim Renewal-Call.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000009';

-- Cluster 4: Nachhaltigkeit / Energie
UPDATE ideas SET
    title_de = 'CO2-bewusstes Scheduling von Batch-Jobs',
    description_de = 'Nicht-dringende Batch-Workloads (Analytics-Rebuilds, Model-Training) in Zeitfenster verschieben, in denen die Netz-CO2-Intensität am niedrigsten ist. Spart geschätzt ~20% Scope-2-Emissionen ohne Service-Einbußen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000010';

UPDATE ideas SET
    title_de = 'Ungenutzte Dev-Environments über Nacht herunterfahren',
    description_de = 'Die meisten Dev/Staging-Cluster liegen von 19:00 bis 08:00 Ortszeit brach. Automatisch auf null skalieren außerhalb der Arbeitszeiten und beim ersten Request wieder hochfahren — spart Cloud-Kosten und Energie, ohne jemanden auszubremsen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000011';

UPDATE ideas SET
    title_de = 'Green-Build-Badge im PR-Template',
    description_de = 'Geschätzte CO2-Kosten jedes CI-Runs am PR anzeigen, mit einem Leaderboard für die effizientesten Builds. Macht CO2 zu einer Engineering-Metrik erster Klasse und stupst Teams zu schlankeren Pipelines.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000012';

-- Outliers
UPDATE ideas SET
    title_de = 'Quartalsweise Red-Team-Übung auf Produktions-Auth-Flows',
    description_de = 'Jedes Quartal eine halbtägige Übung, in der ein kleines internes Red Team versucht, Authentifizierung und Session-Management gegen Staging zu kompromittieren. Erkenntnisse fließen direkt in den Security-Backlog.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000013';

UPDATE ideas SET
    title_de = 'Schreibtisch-Buchung per Slack',
    description_de = 'Ersetzt die sperrige Raum-Buchungs-App durch einen Slack-Slash-Command für Hot-Desks: /desk book floor-3 tomorrow. Schneller als die Web-UI und integriert mit bestehenden Erinnerungen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000014';

UPDATE ideas SET
    title_de = 'Beschaffungs-Transparenz-Dashboard',
    description_de = 'Finance genehmigt Software-Käufe ab EUR 500 einzeln, aber niemand sieht das Gesamtbild. Internes Dashboard aller SaaS-Abonnements mit Owner, Verlängerungsdatum und Sitzplatz-Auslastung veröffentlichen.'
WHERE id = 'ccccccc2-0000-0000-0000-000000000015';

-- ============================================================
-- V6 seed (4 ideas)
-- ============================================================

UPDATE ideas SET
    title_de = 'Idee-DNA — Semantische Cluster-Visualisierung',
    description_de = 'Zeigt, wie jede Idee in der Plattform mit anderen verwandt ist, von ihnen abstammt und zwischen Themen-Clustern Brücken schlägt. Aufbauend auf den vorhandenen pgvector-Embeddings: jede Idee ein Knoten, Kanten verbinden semantische Nachbarn, zusammenhängende Komponenten werden als farbige Cluster sichtbar. Hilft der Führung zu sehen, wo Innovation sich konzentriert und wo die Lücken sind, ohne jede Einreichung lesen zu müssen.'
WHERE id = 'ccccccc3-0000-0000-0000-000000000001';

UPDATE ideas SET
    title_de = 'KI-Advocatus-Diaboli am Priorisierungs-Gate',
    description_de = 'Bevor eine Idee von IN PRÜFUNG nach PRIORISIERUNG wandert, drei automatisch generierte Gegen-Argumente einblenden, fundiert in ähnlichen früheren Ideen des Mandanten. RAG über den pgvector-Index hält die Kritik spezifisch und verhindert, dass das LLM Nachteile halluziniert, die nicht zutreffen. Prüfer können jeden Punkt verwerfen oder als formales Risiko anhängen.'
WHERE id = 'ccccccc3-0000-0000-0000-000000000002';

UPDATE ideas SET
    title_de = 'Innovations-Puls — Einreichungs-Heatmap nach Team',
    description_de = 'Eine Team × Monat-Heatmap der Idee-Einreichungen auf dem Admin-Dashboard. Teams, die drei Monate ohne Einreichung verbringen, werden bernsteinfarben hervorgehoben — als Signal, nicht als Zielvorgabe — damit die Führung fragen kann, ob der Kanal kaputt ist, das Team überlastet oder das Thema einfach noch nicht angekommen ist.'
WHERE id = 'ccccccc3-0000-0000-0000-000000000003';

UPDATE ideas SET
    title_de = 'Ideen-Kopfgelder — den Trichter umdrehen',
    description_de = 'Heute posten Mitarbeitende Probleme, die sie erkannt haben. Kopfgelder kehren das um: Führungskräfte posten eine Problem-Beschreibung mit einer Belohnung (Weiterbildungsbudget, Konferenz-Ticket, ein Nachmittag mit dem Sponsor), und Mitarbeitende reichen gezielte Vorschläge dafür ein. Standard-Workflow und Scoring greifen weiter; das Kopfgeld engt nur den Lösungs-Call ein.'
WHERE id = 'ccccccc3-0000-0000-0000-000000000004';

-- ============================================================
-- V5 campaigns
-- ============================================================

UPDATE campaigns SET
    name_de = 'Q3 Kundenbindung',
    description_de = 'Reduktion der Abwanderung durch engere Feedback-Schleifen und schnellere Verarbeitung von Signal zu Roadmap. Wir wollen mindestens zwei der genehmigten Ideen unter dieser Kampagne bis Ende Q3 ausliefern.'
WHERE id = 'dddddddd-0000-0000-0000-000000000001';

UPDATE campaigns SET
    name_de = 'Engineering-Velocity 2026',
    description_de = 'Mittlere Durchlaufzeit von PR zu Produktion in den nächsten zwei Quartalen um 40% reduzieren. Schwerpunkte: CI, Preview-Environments und lokale Dev-Ergonomie.'
WHERE id = 'dddddddd-0000-0000-0000-000000000002';

UPDATE campaigns SET
    name_de = 'Nachhaltigkeits-Roadmap',
    description_de = 'Bereichsübergreifende Initiative, um Scope-2-Emissionen und Cloud-Ausgaben zu einer gemessenen Kennzahl zu machen und dann an den größten Hebeln zu arbeiten.'
WHERE id = 'dddddddd-0000-0000-0000-000000000003';
