package com.trigrowth.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "automation_actions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recommendation_id")
    private Recommendation recommendation;

    @Column(nullable = false)
    private String actionType;

    @Column(columnDefinition = "TEXT")
    private String actionDetail;

    private Instant executedAt;

    @Column(nullable = false)
    private boolean success = false;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;
}
