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
