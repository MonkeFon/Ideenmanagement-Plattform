import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Content locale = which language the backend should serve user-generated data in
 * (idea titles/descriptions, campaign names). The UI chrome itself is always German;
 * this only flips between the English seed data and the German translations.
 *
 * Default is German: the platform is German-first, so seeded ideas/campaigns and
 * semantic-search results all surface in German unless the user opts into English
 * in the settings.
 */
export type ContentLang = 'en' | 'de'

interface LocaleState {
  contentLang: ContentLang
  setContentLang: (l: ContentLang) => void
}

export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      contentLang: 'de',
      setContentLang: (l) => set({ contentLang: l }),
    }),
    {
      name: 'gb-locale',
      version: 1,
      // English seed content was promoted to German and removed from the DB, and the
      // language toggle is gone. Coerce any browser still persisting 'en' from an older
      // session to 'de' so nobody is pinned to a language that no longer has data.
      migrate: (persisted) => {
        const s = persisted as Partial<LocaleState> | undefined
        return { contentLang: 'de', setContentLang: s?.setContentLang ?? (() => {}) } as LocaleState
      },
    },
  ),
)
