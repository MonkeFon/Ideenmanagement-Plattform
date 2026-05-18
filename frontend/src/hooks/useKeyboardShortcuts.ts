import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Global keyboard shortcuts.
 *
 * Sequence chords (`G` then `I` within 1.5 s) navigate; single keys jump to
 * common actions or focus the page-level input. Anything typed inside an
 * `<input>`, `<textarea>`, `<select>`, or `contenteditable` element is ignored
 * so we don't hijack normal text entry.
 *
 * Shortcuts wired here must match the catalog rendered in `Settings.tsx`.
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const sequenceRef = useRef<{ key: string; t: number } | null>(null)

  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      )
    }

    const focusSearch = () => {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder^="Semantisch suchen"]',
      )
      if (input) {
        input.focus()
        input.select()
      } else {
        // Fall back to the Ideen page where the search lives.
        navigate('/ideas')
      }
    }

    const showShortcutsHelp = () => {
      navigate('/settings')
      // Settings page already lists shortcuts. Scroll to the card.
      setTimeout(() => {
        const card = Array.from(document.querySelectorAll('div')).find(
          (d) => d.textContent === 'Tastenkürzel',
        )
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    }

    function handler(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isTyping(e.target)) {
        // Inside an input, only `Escape` is interesting — blur the field so
        // shortcuts work again.
        if (e.key === 'Escape' && e.target instanceof HTMLElement) e.target.blur()
        return
      }

      // Single-key shortcuts.
      if (e.key === '/') {
        e.preventDefault()
        focusSearch()
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        showShortcutsHelp()
        return
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        navigate('/submit')
        return
      }

      // Chord shortcuts: G then [I|G|K].
      const now = Date.now()
      if (sequenceRef.current && now - sequenceRef.current.t < 1500 && sequenceRef.current.key === 'g') {
        sequenceRef.current = null
        const k = e.key.toLowerCase()
        if (k === 'i') { e.preventDefault(); navigate('/ideas'); return }
        if (k === 'g') { e.preventDefault(); navigate('/graph'); return }
        if (k === 'k') { e.preventDefault(); navigate('/campaigns'); return }
        if (k === 'l') { e.preventDefault(); navigate('/leaderboard'); return }
        if (k === 'h') { e.preventDefault(); navigate('/'); return }
        return
      }
      if (e.key === 'g' || e.key === 'G') {
        sequenceRef.current = { key: 'g', t: now }
        // Clear after the chord window expires.
        setTimeout(() => {
          if (sequenceRef.current && Date.now() - sequenceRef.current.t >= 1500) {
            sequenceRef.current = null
          }
        }, 1600)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}
