import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

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

        navigate('/ideas')
      }
    }

    const showShortcutsHelp = () => {
      navigate('/settings')

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

        if (e.key === 'Escape' && e.target instanceof HTMLElement) e.target.blur()
        return
      }

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
