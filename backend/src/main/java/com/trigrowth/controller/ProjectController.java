package com.trigrowth.controller;

import com.trigrowth.model.*;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.trigrowth.dto.ProjectRequest;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project lifecycle endpoints")
public class ProjectController {

    private final ProjectService     projectService;
    private final ApplicationService applicationService;
    private final MessageService     messageService;
    private final ReviewService      reviewService;
    private final UserRepository     userRepository;

    // ── Project CRUD ──────────────────────────────────────────────

    @GetMapping("/open")
    @Operation(summary = "List all open projects (public)")
    public ResponseEntity<List<Project>> getOpenProjects() {
        return ResponseEntity.ok(projectService.getOpenProjects());
    }

    @PostMapping
    @Operation(summary = "Create a project (CLIENT)")
    public ResponseEntity<Project> createProject(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody ProjectRequest req) {
        User user = resolveUser(ud);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createProject(user.getId(), req));
    }

    @GetMapping("/mine")
    @Operation(summary = "Client's own projects")
    public ResponseEntity<List<Project>> getMyProjects(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(projectService.getMyProjects(resolveUser(ud).getId()));
    }

    @GetMapping("/assigned")
    @Operation(summary = "Freelancer's assigned projects (enriched with teamId for milestone splits)")
    public ResponseEntity<List<Map<String, Object>>> getAssignedProjects(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(projectService.getAssignedProjectsEnriched(resolveUser(ud).getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project detail")
    public ResponseEntity<Project> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProject(id));
    }

    @PostMapping("/{id}/hire/{freelancerId}")
    @Operation(summary = "Hire a freelancer (CLIENT)")
    public ResponseEntity<Project> hireFreelancer(
            @PathVariable Long id,
            @PathVariable UUID freelancerId,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(
                projectService.hireFreelancer(id, freelancerId, resolveUser(ud).getId()));
    }

    @PostMapping("/{id}/reject/{freelancerId}")
    @Operation(summary = "Reject a freelancer bid (CLIENT)")
    public ResponseEntity<Void> rejectFreelancer(
            @PathVariable Long id,
            @PathVariable UUID freelancerId,
            @AuthenticationPrincipal UserDetails ud) {
        projectService.rejectFreelancer(id, freelancerId, resolveUser(ud).getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Project> completeProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.completeProject(id));
    }

    /** FREELANCER: Submit work for client review */
    @PostMapping("/{id}/submit-for-review")
    @Operation(summary = "Freelancer submits work for client review")
    public ResponseEntity<Project> submitForReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody(required = false) SubmitReviewRequest req) {
        String note = req != null ? req.note() : "Work has been submitted for your review.";
        return ResponseEntity.ok(projectService.submitForReview(id, resolveUser(ud).getId(), note));
    }

    /** CLIENT: Approve the freelancer's submitted work → COMPLETED */
    @PostMapping("/{id}/approve-completion")
    @Operation(summary = "Client approves project completion")
    public ResponseEntity<Project> approveCompletion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(projectService.approveCompletion(id, resolveUser(ud).getId()));
    }

    /** CLIENT: Request revision → sends project back to IN_PROGRESS */
    @PostMapping("/{id}/request-revision")
    @Operation(summary = "Client requests revision")
    public ResponseEntity<Project> requestRevision(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody(required = false) RevisionRequest req) {
        String note = req != null ? req.note() : "Please review and resubmit.";
        return ResponseEntity.ok(projectService.requestRevision(id, resolveUser(ud).getId(), note));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Project> cancelProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.cancelProject(id));
    }

    @PutMapping("/{id}/github-repo")
    @Operation(summary = "Set or update GitHub repository URL for project")
    public ResponseEntity<Project> updateGithubRepo(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(projectService.updateGithubRepoUrl(id, body.get("githubRepoUrl")));
    }

    // ── Applications ──────────────────────────────────────────────

    @PostMapping("/{id}/apply")
    @Operation(summary = "Apply to a project (FREELANCER). Pass teamId to bid on behalf of a team.")
    public ResponseEntity<Application> apply(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody ApplicationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                applicationService.apply(id, resolveUser(ud).getId(),
                        req.coverLetter(), req.proposedAmount(), req.teamId()));
    }

    /** Individual (solo) projects for the current freelancer */
    @GetMapping("/assigned/individual")
    @Operation(summary = "Freelancer's solo assigned projects (no team)")
    public ResponseEntity<List<Project>> getIndividualProjects(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(projectService.getIndividualProjects(resolveUser(ud).getId()));
    }

    /** Team projects the current freelancer is part of (leader or member) */
    @GetMapping("/assigned/team")
    @Operation(summary = "All team projects the current freelancer is part of")
    public ResponseEntity<List<Project>> getMyTeamProjects(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(projectService.getTeamProjectsForUser(resolveUser(ud).getId()));
    }

    @GetMapping("/{id}/applications")
    @Operation(summary = "List applications for a project (CLIENT)")
    public ResponseEntity<List<Application>> getApplications(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getProjectApplications(id));
    }

    @GetMapping("/my-applications")
    @Operation(summary = "Get current freelancer's own applications (FREELANCER)")
    public ResponseEntity<List<Application>> getMyApplications(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(applicationService.getMyApplications(resolveUser(ud).getId()));
    }

    // ── Messages ──────────────────────────────────────────────────

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.getMessages(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<Message> sendMessage(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody MessageRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                messageService.sendMessage(id, resolveUser(ud).getId(), req.content()));
    }

    // ── Reviews ───────────────────────────────────────────────────

    @PostMapping("/{id}/reviews")
    @Operation(summary = "Submit a review (CLIENT or FREELANCER)")
    public ResponseEntity<Review> submitReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                reviewService.submitReview(id, resolveUser(ud).getId(),
                        req.revieweeId(), req.rating(), req.comment()));
    }

    @PostMapping("/{id}/reviews/batch")
    @Operation(summary = "Submit batch reviews for team members")
    public ResponseEntity<List<Review>> submitBatchReviews(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody List<ReviewRequest> reqs) {
        java.util.UUID reviewerId = resolveUser(ud).getId();
        List<Review> saved = reqs.stream()
                .map(r -> reviewService.submitReview(id, reviewerId, r.revieweeId(), r.rating(), r.comment()))
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}/reviews")
    @Operation(summary = "Get all reviews for a project (two-way reviews)")
    public ResponseEntity<List<Review>> getProjectReviews(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getProjectReviews(id));
    }

    @GetMapping("/reviews/given")
    @Operation(summary = "Get all reviews given by the current user")
    public ResponseEntity<List<Review>> getMyGivenReviews(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(reviewService.getReviewsGivenBy(resolveUser(ud).getId()));
    }

    @GetMapping("/reviews/received")
    @Operation(summary = "Get all reviews received by the current user")
    public ResponseEntity<List<Review>> getMyReceivedReviews(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(reviewService.getReviewsReceivedBy(resolveUser(ud).getId()));
    }

    // ── Helpers ───────────────────────────────────────────────────

    private User resolveUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    // ── Inline request records ────────────────────────────────────
 
    public record ApplicationRequest(
            @NotBlank String coverLetter,
            @NotNull BigDecimal proposedAmount,
            Long teamId   // null = individual bid; non-null = team bid
    ) {}
 
    public record MessageRequest(@NotBlank String content) {}
 
    public record ReviewRequest(
            UUID revieweeId,
            @NotNull int rating,
            String comment
    ) {}

    public record SubmitReviewRequest(String note) {}

    public record RevisionRequest(String note) {}
}
