package com.trigrowth.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "agent_results")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_event_id")
    private BusinessEvent businessEvent;

    @Column(nullable = false)
    private String agentName;

    private String severity;
    private Double score;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String rawDataJson;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
