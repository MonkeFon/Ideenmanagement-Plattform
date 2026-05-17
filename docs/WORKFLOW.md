# Workflow & Role Model

## Stages

| Stage              | Who can move here from previous                      | Notes |
|--------------------|------------------------------------------------------|-------|
| `DRAFT`            | author (implicit on create)                          | Owner-only visibility — DRAFTs are excluded from tenant-wide views like the graph |
| `SUBMITTED`        | author                                               | Open for votes, comments, similarity lookup |
| `UNDER_REVIEW`     | `INNOVATION_MANAGER`, `ADMIN`                        | Triggers reviewer assignment |
| `PRIORITIZATION`   | `INNOVATION_MANAGER`                                 | Composite score computed; requires ≥1 reviewer evaluation |
| `APPROVED`         | `SPONSOR`, `ADMIN`                                   | Goes into roadmap |
| `IN_IMPLEMENTATION`| `INNOVATION_MANAGER`, `ADMIN`                        | Linked to delivery |
| `DONE`             | `INNOVATION_MANAGER`, `ADMIN`                        | Final |
| `REJECTED`         | `SPONSOR`, `ADMIN`, `INNOVATION_MANAGER`             | With reason |
| `ARCHIVED`         | `ADMIN`                                              | Soft-hide |

The state machine is enforced in [`workflow/IdeaWorkflow.java`](../backend/src/main/java/com/ideaplatform/api/workflow/IdeaWorkflow.java). Every `move(idea, newStage, actor)` call validates:
1. The actor has a role that allows this transition.
2. The target stage is reachable from the current one.
3. Required preconditions are met (e.g., `PRIORITIZATION` requires ≥1 reviewer score).

A transition fails fast with **409 Conflict** when the requested move is not legal for the actor or stage.

## Comments
- All roles can comment on any non-DRAFT idea they can see. `INNOVATION_MANAGER` / `ADMIN` are explicitly included — earlier prototype builds gated them out, which surprised demo users.
- Comments are appended via `POST /api/ideas/{id}/comments` with `{ "body": "..." }`.

## Composite score (PRIORITIZATION)

```
priority = 0.40 * normalize(net_votes)
         + 0.35 * (avg(reviewer_score) / 5.0)
         + 0.15 * recency_decay(submitted_at, half_life=30d)
         + 0.10 * sponsor_boost_flag
```

Weights live under `ideaplatform.scoring.*` in `application.yml` and are overridable per tenant in the future.

## Reviewer scores
Each reviewer rates an idea on three axes (1–5):
- **Impact** — strategic / financial upside
- **Feasibility** — buildability with current capacity
- **Strategic fit** — alignment with company OKRs

`reviewer_score = (impact + feasibility + strategic_fit) / 3`

The payload posted to `/api/ideas/{id}/evaluations` is `{ impact, feasibility, strategicFit, notes }`. All three axes must be 1..5; a missing axis returns 400.

## Sponsor boost
A `SPONSOR` (or `ADMIN`) can flip a one-bit boost on any idea via `PATCH /api/ideas/{id}/sponsor-boost?on=true|false`. The flag flows straight into the composite score (the 10% term). Toggling does not move the stage.

## Campaigns
Campaigns are a grouping mechanism layered on top of the workflow — they do not change which transitions are allowed.

- An idea may belong to at most one campaign, captured in `ideas.campaign_id`.
- The FK is `ON DELETE SET NULL` — deleting a campaign preserves its ideas but clears the linkage.
- `INNOVATION_MANAGER` / `ADMIN` create, edit, and delete campaigns via `/api/campaigns`. All other roles can read but not mutate (`@PreAuthorize` returns 403).
- Submit and detail pages surface a "Submit for this campaign" entry-point that pre-selects the campaign in the new-idea form.
