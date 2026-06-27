-- Per-tenant branding + rename the demo tenant to FOM.
--
-- 1. Add a brand_color to tenants; the frontend themes the app's --primary CSS
--    variable from it, so the colour scheme follows the signed-in user's tenant.
-- 2. Rename "TestMandant" → "FOM" (the university running the course) and move its
--    demo accounts from @testmandant.test to @fom.de. FOM's brand colour is #239F91.
-- 3. Give the second tenant (Globex) a distinct colour so the per-tenant theming is
--    visible when switching tenants.
--
-- Note: DemoPasswordResetter resets passwords for *.test AND @fom.de accounts, so the
-- renamed FOM logins keep working with password "demo1234".

ALTER TABLE tenants ADD COLUMN brand_color VARCHAR(16);

-- FOM (formerly TestMandant) — project brand teal.
UPDATE tenants
   SET name = 'FOM', slug = 'fom', brand_color = '#239F91'
 WHERE slug = 'testmandant';

-- Globex — a visibly different brand so tenant theming is demonstrable.
UPDATE tenants
   SET brand_color = '#4f46e5'
 WHERE slug = 'globex';

-- Move the FOM demo accounts onto the @fom.de domain.
UPDATE users
   SET email = replace(email, '@testmandant.test', '@fom.de')
 WHERE email LIKE '%@testmandant.test';
