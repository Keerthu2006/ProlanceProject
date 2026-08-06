package com.trigrowth.service;

import com.trigrowth.model.Project;
import com.trigrowth.model.Review;
import com.trigrowth.model.User;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.ReviewRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository  reviewRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository    userRepository;

    public Review submitReview(Long projectId, UUID reviewerId, UUID revieweeId,
                               int rating, String comment) {
        Project project  = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));
        User reviewee = userRepository.findById(revieweeId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewee not found"));

        Review review = Review.builder()
                .project(project)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(rating)
                .comment(comment)
                .createdAt(Instant.now())
                .build();

        return reviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public List<Review> getFreelancerReviews(UUID freelancerId) {
        return reviewRepository.findByRevieweeId(freelancerId);
    }

    @Transactional(readOnly = true)
    public List<Review> getProjectReviews(Long projectId) {
        return reviewRepository.findByProjectId(projectId);
    }
}
