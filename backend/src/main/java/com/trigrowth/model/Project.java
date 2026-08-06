package com.trigrowth.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    public enum Status {
        OPEN, IN_PROGRESS, UNDER_REVIEW, COMPLETED, CANCELLED
    }

    public enum ProjectType {
        INDIVIDUAL, TEAM
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectType projectType = ProjectType.INDIVIDUAL;

    private Integer teamSize;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private BigDecimal budgetMin;
    private BigDecimal budgetMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_skills", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<String> skillsRequired = new ArrayList<>();

    @Column(nullable = false)
    private Integer durationDays;

    @Column(nullable = false)
    private boolean featured = false;

    // Tracks the accepted freelancer for easy lookup
    @Column(name = "hired_freelancer_id")
    private java.util.UUID hiredFreelancerId;

    // Message from freelancer when submitting for review
    @Column(columnDefinition = "TEXT")
    private String submissionNote;

    // Message from client when requesting revision
    @Column(columnDefinition = "TEXT")
    private String revisionNote;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
