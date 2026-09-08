package com.trigrowth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @com.fasterxml.jackson.annotation.JsonProperty("projectId")
    public Long fetchProjectId() {
        return project != null ? project.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("projectTitle")
    public String fetchProjectTitle() {
        return project != null ? project.getTitle() : null;
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @com.fasterxml.jackson.annotation.JsonProperty("reviewerId")
    public java.util.UUID fetchReviewerId() {
        return reviewer != null ? reviewer.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("reviewerName")
    public String fetchReviewerName() {
        return reviewer != null ? reviewer.getFullName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewee_id")
    private User reviewee;

    @com.fasterxml.jackson.annotation.JsonProperty("revieweeId")
    public java.util.UUID fetchRevieweeId() {
        return reviewee != null ? reviewee.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("revieweeName")
    public String fetchRevieweeName() {
        return reviewee != null ? reviewee.getFullName() : null;
    }

    @Min(1)
    @Max(5)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
