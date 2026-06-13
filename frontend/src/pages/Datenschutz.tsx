import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import LegalLayout from '@/components/LegalLayout'
import { CONTACT_EMAIL } from '@/lib/legal'

export default function Datenschutz() {
  useEffect(() => { document.title = 'Datenschutz · Geistesblitz' }, [])
  return (
    <LegalLayout title="Datenschutzerklärung">
      <p>
        Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Diese Erklärung informiert Sie gemäß der
        Datenschutz-Grundverordnung (DSGVO) über Art, Umfang und Zweck der Verarbeitung personenbezogener
        Daten in dieser Anwendung.
      </p>

      <section>
        <h2 className="font-semibold text-foreground">1. Verantwortlicher</h2>
        <p className="mt-2">
          Verantwortlich für die Datenverarbeitung ist die im{' '}
          <Link to="/impressum" className="text-primary hover:underline">Impressum</Link> genannte Stelle.
          Kontakt: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">2. Welche Daten wir verarbeiten</h2>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Konto- und Anmeldedaten (E-Mail-Adresse, Anzeigename, Rolle, Mandant)</li>
          <li>von Ihnen erstellte Inhalte (Ideen, Kommentare, Bewertungen, Stimmen)</li>
          <li>technische Protokolldaten, die beim Betrieb der Anwendung anfallen</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">3. Zwecke und Rechtsgrundlage</h2>
        <p className="mt-2">
          Die Verarbeitung erfolgt zur Bereitstellung der Plattform im Rahmen des Nutzungsverhältnisses
          (Art. 6 Abs. 1 lit. b DSGVO) sowie zur Wahrung berechtigter Interessen am sicheren und
          funktionsfähigen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">4. Speicherdauer</h2>
        <p className="mt-2">
          Personenbezogene Daten werden gelöscht, sobald sie für die genannten Zwecke nicht mehr erforderlich
          sind oder Sie deren Löschung verlangen, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">5. Ihre Rechte</h2>
        <p className="mt-2">
          Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
          Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21
          DSGVO). Zudem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">6. Kontakt in Datenschutzfragen</h2>
        <p className="mt-2">
          Für Anfragen zum Datenschutz erreichen Sie uns unter{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <p className="text-[12px] text-muted-foreground">
        Hinweis: Diese Anwendung ist ein Prototyp. Diese Datenschutzerklärung ist ein Muster und vor einer
        Veröffentlichung rechtlich zu prüfen und zu vervollständigen.
      </p>
    </LegalLayout>
  )
}
