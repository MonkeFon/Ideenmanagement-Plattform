# Licensing Model

The platform is sold per-tenant under three plans.

| Plan        | Seats | Ideas / month | RAG refine | Custom workflow | SSO   | Price (demo) |
|-------------|-------|---------------|------------|-----------------|-------|--------------|
| **Free**    | 10    | 30            | ✗          | ✗               | ✗     | €0           |
| **Pro**     | 100   | unlimited     | ✓          | ✗               | ✓     | €9 / seat    |
| **Enterprise** | unlimited | unlimited | ✓        | ✓               | ✓     | custom       |

## Enforcement points

| Action                       | Check                                  |
|------------------------------|----------------------------------------|
| Invite user                  | `seats_used < plan.seat_limit`         |
| Submit idea                  | `ideas_this_month < plan.idea_limit`   |
| POST `/api/ideas/{id}/refine`| `plan.features` contains `rag_refine`  |
| PUT `/api/workflow/config`   | `plan.features` contains `custom_wf`   |
| Any mutating endpoint        | `tenant.plan_expires_at > now()`       |

Violations return **HTTP 402 Payment Required** with `X-License-Reason` header naming the failing check. The frontend surfaces an upgrade banner.
