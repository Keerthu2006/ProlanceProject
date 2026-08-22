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

    @PostMapping
    public ResponseEntity<Milestone> createMilestone(
            @PathVariable Long projectId,
            @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.createMilestone(
                projectId, request.getTitle(), request.getDescription(), request.getAmount(), request.getDueDate(), user));
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
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.updateStatus(milestoneId, request.getStatus(), request.getSubmissionNote(), user));
    }

    @PutMapping("/{milestoneId}/approve")
    public ResponseEntity<Milestone> approveMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.approveMilestone(milestoneId, user));
    }

    @PutMapping("/{milestoneId}/reject")
    public ResponseEntity<Milestone> rejectMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @RequestBody RejectRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.rejectMilestone(milestoneId, request.getFeedback(), user));
    }

    @PutMapping("/{milestoneId}/accept-extra")
    public ResponseEntity<Milestone> acceptExtraMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.acceptExtraMilestone(milestoneId, user));
    }

    @DeleteMapping("/{milestoneId}/reject-extra")
    public ResponseEntity<Void> rejectExtraMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @AuthenticationPrincipal User user) {
        milestoneService.rejectExtraMilestone(milestoneId, user);
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
    }

    @Data
    static class RejectRequest {
        private String feedback;
    }
}
