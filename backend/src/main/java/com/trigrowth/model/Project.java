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

    // Expose owner info without circular reference
    @com.fasterxml.jackson.annotation.JsonProperty("ownerId")
    public java.util.UUID getOwnerId() {
        return owner != null ? owner.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("ownerName")
    public String getOwnerName() {
        return owner != null ? owner.getFullName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    // Expose client info without circular reference
    @com.fasterxml.jackson.annotation.JsonProperty("clientId")
    public java.util.UUID getClientId() {
        return client != null ? client.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("clientName")
    public String getClientName() {
        return client != null ? client.getFullName() : null;
    }

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

    private Integer numberOfMilestones;
    
    private Instant dueDate;
    
    @Builder.Default
    private BigDecimal totalPaid = BigDecimal.ZERO;

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
