# Licensing Model

The platform is sold per-tenant under three plans.

| Plan           | Seats     | Ideas / month | RAG refine + chat | Custom workflow | SSO   | Price (demo) |
|----------------|-----------|---------------|-------------------|-----------------|-------|--------------|
| **Free**       | 10        | 30            | ✗                 | ✗               | ✗     | €0           |
| **Pro**        | 100       | unlimited     | ✓                 | ✗               | ✓     | €9 / seat    |
| **Enterprise** | unlimited | unlimited     | ✓                 | ✓               | ✓     | custom       |

## Enforcement points

| Action                                | Check                                  |
|---------------------------------------|----------------------------------------|
| Invite user                           | `seats_used < plan.seat_limit`         |
| Submit idea                           | `ideas_this_month < plan.idea_limit`   |
| `POST /api/ideas/{id}/refine`         | `plan.features` contains `rag_refine`  |
| `POST /api/ideas/{id}/chat`           | `plan.features` contains `rag_refine`  |
| `PUT  /api/workflow/config` *(future)*| `plan.features` contains `custom_wf`   |
| Any mutating endpoint                 | `tenant.plan_expires_at > now()`       |

`@RequiresFeature("...")` is the AOP entry-point for feature-flag checks; `LicenseInterceptor` runs before the controller for seat / quota / expiry checks.

Violations return **HTTP 402 Payment Required** with `X-License-Reason` header naming the failing check (`seat_limit_reached`, `idea_quota_reached`, `feature_not_in_plan`, `plan_expired`). The frontend surfaces an upgrade banner — see `frontend/src/api/client.ts` for the `asLicenseViolation(err)` helper that callers use to detect license errors and render the upgrade hint.

## Demo tenants
- **TestMandant** (`tenant_id = 1111…`) — `Pro` plan, used by every `*@testmandant.test` account. RAG refine + chat available.
- **Globex** (`tenant_id = 2222…`) — `Free` plan, single `owner@globex.test` account. Refine + chat return 402 with `feature_not_in_plan` so you can demo the upgrade flow.
