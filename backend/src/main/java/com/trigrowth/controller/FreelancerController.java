package com.trigrowth.controller;

import com.trigrowth.model.FreelancerProfile;
import com.trigrowth.model.Review;
import com.trigrowth.model.User;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.service.FreelancerProfileService;
import com.trigrowth.service.ReviewService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.trigrowth.dto.ProfileUpdateRequest;

import java.util.List;

@RestController
@RequestMapping("/freelancers")
@RequiredArgsConstructor
@Tag(name = "Freelancers", description = "Freelancer profile management")
public class FreelancerController {

    private final FreelancerProfileService freelancerProfileService;
    private final ReviewService            reviewService;
    private final UserRepository           userRepository;

    @GetMapping
    public ResponseEntity<List<FreelancerProfile>> getAllFreelancers() {
        return ResponseEntity.ok(freelancerProfileService.getAllFreelancers());
    }

    @GetMapping("/me")
    public ResponseEntity<FreelancerProfile> getMyProfile(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(freelancerProfileService.getMyProfile(resolveUser(ud).getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FreelancerProfile> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(freelancerProfileService.getProfileById(id));
    }

    @PutMapping("/me")
    public ResponseEntity<FreelancerProfile> updateProfile(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody ProfileUpdateRequest body) {
        return ResponseEntity.ok(
                freelancerProfileService.updateProfile(resolveUser(ud).getId(), body));
    }

    @PostMapping("/feature-usage/{key}")
    public ResponseEntity<Void> logFeatureUsage(
            @PathVariable String key,
            @AuthenticationPrincipal UserDetails ud) {
        freelancerProfileService.logFeatureUsage(resolveUser(ud).getId(), key);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<Review>> getReviews(@PathVariable Long id) {
        FreelancerProfile profile = freelancerProfileService.getProfileById(id);
        return ResponseEntity.ok(reviewService.getFreelancerReviews(profile.getUser().getId()));
    }

    private User resolveUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
