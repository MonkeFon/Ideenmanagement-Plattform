import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import GeistesblitzLogo from '@/components/GeistesblitzLogo'
import Footer from '@/components/Footer'

export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl w-full px-4 md:px-6 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-primary grid place-items-center text-primary-foreground shrink-0">
              <GeistesblitzLogo size={22} />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">Geistesblitz</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl w-full px-4 md:px-6 py-8 md:py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-foreground/90">{children}</div>
          <div className="mt-10">
            <Link to="/" className="text-[13px] text-primary hover:underline">← Zurück zur Startseite</Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
