package com.ideaplatform.api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "workflow_history")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkflowHistory {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "idea_id", nullable = false)
    private UUID ideaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_stage", length = 32)
    private Stage fromStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_stage", nullable = false, length = 32)
    private Stage toStage;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(columnDefinition = "text")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
