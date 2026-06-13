import { useEffect } from 'react'
import LegalLayout from '@/components/LegalLayout'
import { CONTACT_EMAIL } from '@/lib/legal'

export default function Impressum() {
  useEffect(() => { document.title = 'Impressum · Geistesblitz' }, [])
  return (
    <LegalLayout title="Impressum">
      <section>
        <h2 className="font-semibold text-foreground">Angaben gemäß § 5 TMG</h2>
        <p className="mt-2">
          [Name der verantwortlichen Person / des Unternehmens]<br />
          [Straße und Hausnummer]<br />
          [PLZ und Ort]<br />
          Deutschland
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">Kontakt</h2>
        <p className="mt-2">
          E-Mail:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p className="mt-2">[Name], Anschrift wie oben.</p>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">Haftung für Inhalte</h2>
        <p className="mt-2">
          Die Inhalte dieser Anwendung wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.
        </p>
      </section>

      <p className="text-[12px] text-muted-foreground">
        Hinweis: Diese Anwendung ist ein Prototyp. Die mit [ … ] markierten Pflichtangaben sind vor einer
        Veröffentlichung zu ergänzen.
      </p>
    </LegalLayout>
  )
}
