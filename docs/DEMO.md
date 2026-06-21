# Demo-Drehbuch — Geistesblitz (≈ 10 Minuten, live)

Ziel: in zehn Minuten den **gesamten Lebenszyklus einer Idee** zeigen und dabei die
beiden Alleinstellungsmerkmale — **semantische Suche/Karte** und **Mehrmandanten­sicherheit** —
sowie den **rollenbasierten Workflow** sichtbar beweisen.

> Tipp: Erzählt eine *Geschichte* (eine Idee von der Einreichung bis zur Rangliste),
> nicht eine Liste von Funktionen. Jedes Teammitglied übernimmt „seinen" Abschnitt
> (passend zur Beitragsmatrix im Reflexionsbericht).

---

## Vor dem Start (T‑10 Minuten)

1. **`powershell -ExecutionPolicy Bypass -File scripts\demo-prep.ps1`** ausführen.
   Das Skript startet/prüft alle vier Dienste (Postgres, Backend, Frontend, Ollama),
   **wärmt die semantische Suche vor** (sonst ist der *erste* Live‑Aufruf langsam) und
   gibt am Ende die Demo‑Konten + getesteten Suchbegriffe aus.
2. Browser auf **http://localhost:5173** öffnen, Vollbild (F11), Zoom ~110 % für Sichtbarkeit.
3. **Fallback bereithalten:** Ordner `docs/screenshots/` offen (+ optional eine kurze
   Bildschirmaufnahme), falls live etwas hängt.
4. **Den `/dev`‑Tab schließen.** Die God‑Mode‑Datenkonsole untergräbt eure Sicherheits­aussage,
   wenn sie aus Versehen auftaucht — vorher zum Stellen der Daten nutzen, dann Tab zu.
5. **Einmal komplett durchklicken** (besonders die KI‑Schritte: erster Ollama‑Aufruf ist langsam).

---

## Besetzung (Konten — Passwort überall `demo1234`)

| Person | Konto | Rolle |
|--------|-------|-------|
| **Michel** | `alice@testmandant.test` | Mitarbeiter |
| **Hayao** | `bob@testmandant.test` | Mitarbeiter |
| **Jan** | `reviewer@testmandant.test` | Prüfer |
| **Michael** | `sponsor@testmandant.test` | Sponsor |
| **Lifon** | `manager@testmandant.test` | Ideenmanager |
| **Timo** | `admin@testmandant.test` | Administrator |
| Glo Owner | `owner@globex.test` | Admin im **zweiten Mandanten** (Tarif *Free*) |

Auf der Anmeldeseite gibt es eine **Ein‑Klick‑Auswahl** dieser Konten.

---

## Ablauf (10 Minuten)

**K = Kernpfad (immer zeigen) · O = optional (nur wenn Zeit bleibt).**

| Zeit | Segment | Wer / Wo | Aktion & Sprechtext |
|------|---------|----------|---------------------|
| 0:00–1:00 | **Rahmen** (K) | Folie / Anmeldeseite | „Gute Ideen gehen in Unternehmen verloren, weil ein strukturierter Prozess fehlt." Architektur in einem Satz: *React‑SPA + Spring‑Boot‑API + PostgreSQL/pgvector + lokales Ollama, mandantenfähig mit dreischichtiger Trennung.* |
| 1:00–1:30 | **Anmeldung** (K) | Michel | Demo‑Auswahl → `alice` → **Dashboard**. „Mitarbeitersicht: Trends, meine Ideen, letzte Aktivität." |
| 1:30–3:00 | **Einreichen + Duplikaterkennung** (K) | Michel → „Idee einreichen" | Titel exakt: **„Ruhezone für fokussiertes Arbeiten und Pausen"**. Während des Tippens erscheint das Duplikat‑Panel mit **„Ruheraum für Pausen…" ≈ 90 %**. Sprechtext: „Die Erkennung arbeitet **semantisch** — sie sieht die inhaltliche Nähe *trotz anderer Wörter* (Vektor‑Ähnlichkeit), nicht nur Stichwörter." Kurze Beschreibung + Kategorie wählen, **absenden**. |
| 3:00–4:00 | **Transparente Bewertung** (K) | Michel | Eine Idee öffnen → **Priorität‑Aufschlüsselung** (Stimmen / Prüfer / Aktualität / Sponsor mit Gewichten). Eine **Stimme** abgeben. „Das Ranking ist nachvollziehbar, keine Blackbox." |
| 4:00–5:00 | **Rolle: Prüfer** (K) | Jan | Abmelden → `reviewer`. Idee **bewerten** (Wirkung / Machbarkeit / strategische Passung). „Erst eine Prüferbewertung schaltet die Priorisierungs‑Phase frei." |
| 5:00–5:45 | **Rolle: Ideenmanager + Workflow** (K) | Lifon | Abmelden → `manager` → **Workflow‑Board**. Karte in die nächste Phase **ziehen** — nur die erlaubten Spalten leuchten auf. „Übergänge sind **serverseitig** rollengeschützt, nicht nur in der Oberfläche ausgeblendet." |
| 5:45–7:15 | **Semantische Suche + Karte** (K, Höhepunkt) | Lifon/Timo | **Ideen** → Suchfeld: **„Pausen und Konzentration bei der Arbeit verbessern"** → **Suche** → 5 Treffer mit **Ähnlichkeit %**. Dann **Graph** → die **semantische Karte** mit Clustern. „Embeddings entstehen **lokal** (bge‑m3 über Ollama), Ähnlichkeit per pgvector — **keine Daten verlassen das Haus**." |
| 7:15–8:15 | **Beweis: Sicherheit** (K — *eine* Variante) | — | **(a) Mandantentrennung:** zweites Browser‑Fenster, Anmeldung `owner@globex.test` → komplett **getrennte Daten**. *Optional:* direkte URL zu einer fremden Idee → „nicht gefunden". **(b) Rollenschutz:** als Michel ist **Workflow** im Menü weg, und `/(…)/workflow` direkt eingeben → Umleitung. |
| 8:15–9:15 | **Rangliste (+ Admin/Lizenz)** (K/O) | Timo | **Rangliste** (Top‑Ideen + aktivste Mitwirkende). *Optional:* **Admin** (Nutzer + Lizenznutzung) oder **Einstellungen** (Tarif‑Karten Free/Pro/Enterprise). |
| 9:15–10:00 | **Abschluss** (K) | alle | Ein Satz Architektur‑Recap + **ehrliche Team‑Reflexion** (berufsbegleitend gebaut; was wir beim nächsten Mal früher machen würden). „Fragen?" |

---

## Optionale Bausteine (nur als Puffer/auf Nachfrage)

- **Lizenz‑Schranke live (402).** Als `owner@globex.test` (Tarif *Free*) eine Idee öffnen und
  **„KI‑Verfeinern"** klicken → Server antwortet **402** und die Oberfläche zeigt das
  **Upgrade‑Banner**. Beweist serverseitige Tarif‑Durchsetzung. *(Vorher einmal testen.)*
- **KI‑Verfeinerung (Pro).** Als Pro‑Nutzer auf einer Idee „KI‑Verfeinern" → LLM‑Vorschläge.
  ⚠️ **Latenz ~5–15 s** (Ollama/Qwen) — nur zeigen, wenn vorgewärmt, sonst überspringen.
- **Dark Mode.** Schnellumschalter oben in der Leiste — netter 3‑Sekunden‑Effekt zum Schluss.

---

## Stolperfallen

- **Nur getestete Suchbegriffe verwenden, nicht live improvisieren.** Manche Anfragen liefern 0
  Treffer (z. B. „Energie sparen"). Geprüft & gut: die beiden oben genannten Texte.
- **Ollama‑Kaltstart:** der erste Embedding/LLM‑Aufruf ist langsam → `demo-prep.ps1` wärmt vor.
- **`/dev` nicht zeigen** (God‑Mode, mandantenübergreifend).
- **„Seite plötzlich leer / abgemeldet"** = JWT abgelaufen (TTL 480 Min). Vor dem Demo frisch anmelden.
- **Nicht live tippen, was man vorbereiten kann** — Demo‑Konten‑Auswahl statt E‑Mail tippen.

---

## Zwischen Proben zurücksetzen

```powershell
powershell -ExecutionPolicy Bypass -File scripts\demo-prep.ps1 -Reset
```

Setzt die Datenbank auf den sauberen Seed‑Stand zurück (Migrationen + deutscher Seed),
startet das Backend neu und lässt die Embeddings neu erzeugen. Dauert **~1–2 Minuten**
(Re‑Embedding über Ollama) — also **nicht** unmittelbar vor dem echten Auftritt, sondern
zwischen Proben ausführen.

---

## Schnellreferenz (Copy‑Paste)

- **Duplikat‑Titel:** `Ruhezone für fokussiertes Arbeiten und Pausen`  → trifft „Ruheraum für Pausen…" ~90 %
- **Suchbegriff:** `Pausen und Konzentration bei der Arbeit verbessern`  → 5 Treffer
- **App:** http://localhost:5173   ·   **Konten:** siehe Besetzung, Passwort `demo1234`
