package com.ideaplatform.api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Plan {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "display_name", nullable = false, length = 64)
    private String displayName;

    @Column(name = "seat_limit")
    private Integer seatLimit;          // null = unlimited

    @Column(name = "idea_limit")
    private Integer ideaLimit;          // null = unlimited (per month)

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<String> features;

    @Column(name = "price_eur", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceEur;

    public boolean hasFeature(String feature) {
        return features != null && features.contains(feature);
    }
}
