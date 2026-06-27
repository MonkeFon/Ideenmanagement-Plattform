-- Remove the German-translation (_de) columns. The platform is German-only now;
-- the canonical title/description/name already hold the German text (promoted in V10),
-- so these duplicate columns are dropped together with the locale plumbing.
ALTER TABLE ideas     DROP COLUMN IF EXISTS title_de,
                      DROP COLUMN IF EXISTS description_de;
ALTER TABLE campaigns DROP COLUMN IF EXISTS name_de,
                      DROP COLUMN IF EXISTS description_de;
