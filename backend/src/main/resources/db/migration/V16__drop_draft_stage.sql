-- DRAFT stage removed: ideas are now created directly as SUBMITTED (there was never a
-- persisted draft — the UI created and immediately submitted). Convert any lingering
-- DRAFT rows and switch the column default. There is no CHECK constraint on stage to alter.
UPDATE ideas
   SET stage = 'SUBMITTED',
       submitted_at = COALESCE(submitted_at, created_at, now())
 WHERE stage = 'DRAFT';

ALTER TABLE ideas ALTER COLUMN stage SET DEFAULT 'SUBMITTED';
