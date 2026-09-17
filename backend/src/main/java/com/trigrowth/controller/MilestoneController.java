package com.trigrowth.controller;

import com.trigrowth.model.Milestone;
import com.trigrowth.model.User;
import com.trigrowth.service.MilestoneService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;
    private final com.trigrowth.repository.UserRepository userRepository;

    private User resolveUser(org.springframework.security.core.userdetails.UserDetails ud) {
        if (ud == null) {
            throw new IllegalStateException("Authenticated user not found in context");
        }
        if (ud instanceof User u) {
            return u;
        }
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found: " + ud.getUsername()));
    }

    @PostMapping
    public ResponseEntity<Milestone> createMilestone(
            @PathVariable Long projectId,
            @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails ud) {
        return ResponseEntity.ok(milestoneService.createMilestone(
                projectId, request.getTitle(), request.getDescription(), request.getAmount(), request.getDueDate(), resolveUser(ud)));
    }

    @GetMapping
    public ResponseEntity<List<Milestone>> getMilestones(@PathVariable Long projectId) {
        return ResponseEntity.ok(milestoneService.getProjectMilestones(projectId));
    }

    @PutMapping("/{milestoneId}/status")
    public ResponseEntity<Milestone> updateStatus(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails ud) {
        return ResponseEntity.ok(milestoneService.updateStatus(
                milestoneId,
                request.getStatus(),
                request.getSubmissionNote(),
                request.getGithubPrUrl(),
                request.getGithubBranch(),
                request.getAssignedFreelancerId(),
                request.getAssignedFreelancerName(),
                resolveUser(ud)));
    }

    @PutMapping("/{milestoneId}/approve")
    public ResponseEntity<Milestone> approveMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails ud) {
        return ResponseEntity.ok(milestoneService.approveMilestone(milestoneId, resolveUser(ud)));
    }

    @PutMapping("/{milestoneId}/reject")
    public ResponseEntity<Milestone> rejectMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @RequestBody RejectRequest request,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails ud) {
        return ResponseEntity.ok(milestoneService.rejectMilestone(milestoneId, request.getFeedback(), resolveUser(ud)));
    }

    @PutMapping("/{milestoneId}/accept-extra")
    public ResponseEntity<Milestone> acceptExtraMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails ud) {
        return ResponseEntity.ok(milestoneService.acceptExtraMilestone(milestoneId, resolveUser(ud)));
    }

    @DeleteMapping("/{milestoneId}/reject-extra")
    public ResponseEntity<Void> rejectExtraMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails ud) {
        milestoneService.rejectExtraMilestone(milestoneId, resolveUser(ud));
        return ResponseEntity.ok().build();
    }

    @Data
    static class MilestoneRequest {
        private String title;
        private String description;
        private BigDecimal amount;
        private Instant dueDate;
    }

    @Data
    static class StatusUpdateRequest {
        private Milestone.Status status;
        private String submissionNote;
        private String githubPrUrl;
        private String githubBranch;
        private java.util.UUID assignedFreelancerId;
        private String assignedFreelancerName;
    }

    @Data
    static class RejectRequest {
        private String feedback;
    }
}
