# Workflow & Role Model

## Stages

| Stage              | Who can move here from previous                      | Notes |
|--------------------|------------------------------------------------------|-------|
| `DRAFT`            | author (implicit on create)                          | Owner-only visibility |
| `SUBMITTED`        | author                                               | Open for votes & comments |
| `UNDER_REVIEW`     | INNOVATION_MANAGER, ADMIN                            | Triggers reviewer assignment |
| `PRIORITIZATION`   | INNOVATION_MANAGER                                   | Composite score computed |
| `APPROVED`         | SPONSOR, ADMIN                                       | Goes into roadmap |
| `IN_IMPLEMENTATION`| INNOVATION_MANAGER, ADMIN                            | Linked to delivery |
| `DONE`             | INNOVATION_MANAGER, ADMIN                            | Final |
| `REJECTED`         | SPONSOR, ADMIN, INNOVATION_MANAGER                   | With reason |
| `ARCHIVED`         | ADMIN                                                | Soft-hide |

The state machine is enforced in `workflow/IdeaWorkflow.java`. Every `move(idea, newStage, actor)` call validates:
1. The actor has a role that allows this transition.
2. The target stage is reachable from the current one.
3. Required preconditions are met (e.g., PRIORITIZATION requires ≥1 reviewer score).

## Composite score (PRIORITIZATION)

```
priority = 0.40 * normalize(net_votes)
         + 0.35 * (avg(reviewer_score) / 5.0)
         + 0.15 * recency_decay(submitted_at, half_life=30d)
         + 0.10 * sponsor_boost_flag
```

Weights are configurable via `ideaplatform.scoring.*` in `application.yml` and overridable per tenant.

## Reviewer scores
Each reviewer rates an idea on three axes (1–5):
- **Impact** — strategic / financial upside
- **Feasibility** — buildability with current capacity
- **Strategic fit** — alignment with company OKRs

`reviewer_score = (impact + feasibility + strategic_fit) / 3`
