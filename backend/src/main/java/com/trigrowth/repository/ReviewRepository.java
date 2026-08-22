package com.trigrowth.repository;

import com.trigrowth.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project.client", "project.owner", "project.skillsRequired", "reviewer", "reviewee"})
    List<Review> findByRevieweeId(UUID revieweeId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project.client", "project.owner", "project.skillsRequired", "reviewer", "reviewee"})
    List<Review> findByReviewerId(UUID reviewerId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project.client", "project.owner", "project.skillsRequired", "reviewer", "reviewee"})
    List<Review> findByProjectId(Long projectId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project.client", "project.owner", "project.skillsRequired", "reviewer", "reviewee"})
    List<Review> findTop20ByOrderByCreatedAtDesc();
}
