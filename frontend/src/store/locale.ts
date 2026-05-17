import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Content locale = which language the backend should serve user-generated data in
 * (idea titles/descriptions, campaign names). The UI chrome itself is always German;
 * this only flips between the English seed data and the German translations.
 */
export type ContentLang = 'en' | 'de'

interface LocaleState {
  contentLang: ContentLang
  setContentLang: (l: ContentLang) => void
}

export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      contentLang: 'en',
      setContentLang: (l) => set({ contentLang: l }),
    }),
    { name: 'gb-locale' },
  ),
)
