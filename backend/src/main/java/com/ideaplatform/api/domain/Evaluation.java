package com.ideaplatform.api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "evaluations", uniqueConstraints = @UniqueConstraint(columnNames = {"idea_id", "reviewer_id"}))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evaluation {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "idea_id", nullable = false)
    private UUID ideaId;

    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;

    @Column(nullable = false)
    private short impact;            // 1..5

    @Column(nullable = false)
    private short feasibility;       // 1..5

    @Column(name = "strategic_fit", nullable = false)
    private short strategicFit;      // 1..5

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    public double average() {
        return (impact + feasibility + strategicFit) / 3.0;
    }
}
