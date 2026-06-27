-- Rename the seeded demo accounts' e-mails from role-based to the person's first
-- name (the display_name already carries the name). V3 is an applied migration and
-- must stay immutable, so this additive migration updates the rows in place.
-- The Globex tenant's generic owner@globex.test is intentionally left unchanged.
UPDATE users SET email = 'timo@testmandant.test'    WHERE email = 'admin@testmandant.test';
UPDATE users SET email = 'michael@testmandant.test' WHERE email = 'sponsor@testmandant.test';
UPDATE users SET email = 'lifon@testmandant.test'   WHERE email = 'manager@testmandant.test';
UPDATE users SET email = 'jan@testmandant.test'     WHERE email = 'reviewer@testmandant.test';
UPDATE users SET email = 'michel@testmandant.test'  WHERE email = 'alice@testmandant.test';
UPDATE users SET email = 'hayao@testmandant.test'   WHERE email = 'bob@testmandant.test';
