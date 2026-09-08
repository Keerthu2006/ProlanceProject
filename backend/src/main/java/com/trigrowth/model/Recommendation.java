package com.trigrowth.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "recommendations")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "agent_result_id")
    private AgentResult agentResult;

    private int priority;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING / APPROVED / REJECTED / EXECUTED

    @Column(columnDefinition = "TEXT")
    private String problem;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String prediction;

    @Column(columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(columnDefinition = "TEXT")
    private String expectedImprovement;

    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String automationPlanJson;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
