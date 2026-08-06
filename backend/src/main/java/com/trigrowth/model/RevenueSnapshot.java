package com.trigrowth.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "revenue_snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Month in 'YYYY-MM' format, e.g. '2024-07'.
     */
    @Column(nullable = false, unique = true, length = 7)
    private String month;

    @Column(precision = 19, scale = 2)
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(nullable = false)
    private int contractCount = 0;

    @Column(precision = 19, scale = 2)
    private BigDecimal avgContractValue = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
