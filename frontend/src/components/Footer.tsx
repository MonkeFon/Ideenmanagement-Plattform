import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/legal'

/** Slim site footer with the legally-required German links (Impressum, Datenschutz) + contact. */
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-muted-foreground">
        <div>© {year} {SITE_NAME} · Prototyp</div>
        <nav className="flex items-center gap-4">
          <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
          <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground transition-colors">Kontakt</a>
        </nav>
      </div>
    </footer>
  )
}
