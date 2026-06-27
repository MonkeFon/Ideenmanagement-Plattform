package com.ideaplatform.api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ideas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@FilterDef(name = "ideaTenantFilter", parameters = @ParamDef(name = "tenantId", type = UUID.class))
@Filter(name = "ideaTenantFilter", condition = "tenant_id = :tenantId")
public class Idea {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    // Per-tenant sequential reference number, rendered as a Jira-style key (e.g.
    // GEIST-7) in the UI. Assigned on create; see V22__idea_reference.sql.
    @Column(name = "reference")
    private Integer reference;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(length = 64)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Stage stage;

    @Column(name = "sponsor_boost", nullable = false)
    private boolean sponsorBoost;

    @Column(name = "priority_score")
    private Double priorityScore;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "campaign_id")
    private UUID campaignId;

    // Assignment pipeline — see V21__idea_assignment.sql. "preferred" is a non-binding
    // up-front suggestion (usually from the submitter); "assigned" is the actual
    // pipeline assignment that drives the reviewer/idea-manager task board.
    @Column(name = "preferred_reviewer_id")
    private UUID preferredReviewerId;

    @Column(name = "preferred_manager_id")
    private UUID preferredManagerId;

    @Column(name = "assigned_reviewer_id")
    private UUID assignedReviewerId;

    @Column(name = "assigned_manager_id")
    private UUID assignedManagerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (stage == null) stage = Stage.SUBMITTED;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
