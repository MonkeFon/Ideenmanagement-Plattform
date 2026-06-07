-- Make German the canonical language for all seeded content.
--
-- The platform is German-first (the UI defaults to and only offers German, and the
-- English language toggle was removed). The V3–V7 seeds stored English in
-- title/description with German in title_de/description_de. This migration promotes the
-- German text into the canonical title/description columns so a fresh `flyway migrate`
-- reproduces the exact dataset everyone demos against — no manual post-seed step.
--
-- Only rows that actually carry a German translation are touched, so the NOT NULL
-- title/description columns are never set to null. Globex's English-only seed ideas
-- (no translation) are intentionally left as-is.

UPDATE ideas
   SET title = title_de
 WHERE title_de IS NOT NULL AND title_de <> '';

UPDATE ideas
   SET description = description_de
 WHERE description_de IS NOT NULL AND description_de <> '';

UPDATE campaigns
   SET name = name_de
 WHERE name_de IS NOT NULL AND name_de <> '';

UPDATE campaigns
   SET description = description_de
 WHERE description_de IS NOT NULL AND description_de <> '';
