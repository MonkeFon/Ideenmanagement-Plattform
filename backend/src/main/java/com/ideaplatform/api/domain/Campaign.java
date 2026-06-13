package com.ideaplatform.api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "campaigns")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Campaign {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "name_de", length = 120)
    private String nameDe;

    @Column(name = "description_de", columnDefinition = "text")
    private String descriptionDe;

    @Column(nullable = false, length = 16)
    private String color;

    @Column(name = "starts_at")
    private OffsetDateTime startsAt;

    @Column(name = "ends_at")
    private OffsetDateTime endsAt;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (color == null || color.isBlank()) color = "#6366f1";
    }
}
