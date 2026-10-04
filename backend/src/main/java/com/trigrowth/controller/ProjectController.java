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
    private final com.trigrowth.repository.FreelancerProfileRepository profileRepository;
    private final com.trigrowth.repository.TeamRepository teamRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.trigrowth.service.NotificationService notificationService;


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

    @GetMapping("/{id}/ai-matches")
    @Operation(summary = "Get AI semantic matches for a project")
    public ResponseEntity<?> getAiMatches(@PathVariable Long id) {
        Project p = projectService.getProject(id);
        List<Map<String,Object>> entities = new java.util.ArrayList<>();
        
        if (p.getProjectType() != null && p.getProjectType().name().equals("TEAM")) {
            // For TEAM projects, fetch fixed Teams instead of random individuals
            for(com.trigrowth.model.Team team : teamRepository.findAll()) {
                java.util.Set<String> compositeSkills = new java.util.HashSet<>();
                StringBuilder bioBuilder = new StringBuilder();
                double avgRate = 0.0;
                int memberCount = 0;
                
                for (com.trigrowth.model.User member : team.getMembers()) {
                    profileRepository.findByUserId(member.getId()).ifPresent(prof -> {
                        if (prof.getSkills() != null) compositeSkills.addAll(prof.getSkills());
                        if (prof.getBio() != null) bioBuilder.append(prof.getBio()).append(" ");
                    });
                    memberCount++;
                }
                
                entities.add(Map.of(
                    "id", team.getId().toString(), // Using team ID as freelancer_id
                    "name", team.getName() + " (Fixed Team)",
                    "hourly_rate", memberCount > 0 ? (avgRate / memberCount) : 0.0,
                    "headline", "Agency / Pre-formed Team",
                    "bio", bioBuilder.toString(),
                    "skills", new java.util.ArrayList<>(compositeSkills)
                ));
            }
        } else {
            // For INDIVIDUAL projects, fetch freelancers
            for(com.trigrowth.model.FreelancerProfile prof : profileRepository.findAll()) {
                entities.add(Map.of(
                    "id", prof.getUser().getId().toString(),
                    "name", prof.getUser().getFullName(),
                    "hourly_rate", prof.getHourlyRate() != null ? prof.getHourlyRate().doubleValue() : 0.0,
                    "headline", prof.getHeadline() != null ? prof.getHeadline() : "",
                    "bio", prof.getBio() != null ? prof.getBio() : "",
                    "skills", prof.getSkills() != null ? prof.getSkills() : List.of()
                ));
            }
        }

        // --- ADDED MOCK DATA FOR DEMO IF EMPTY ---
        if (entities.isEmpty()) {
            if (p.getProjectType() != null && p.getProjectType().name().equals("TEAM")) {
                entities.add(Map.of("id", "901", "name", "WebWizards Agency", "hourly_rate", 120.0, "headline", "Full-Stack Agency", "bio", "We build scalable enterprise apps.", "skills", List.of("React", "Node.js", "AWS", "Python")));
            } else {
                entities.add(Map.of("id", "101", "name", "Alice Dev", "hourly_rate", 55.0, "headline", "Senior React Developer", "bio", "I build fast and scalable web apps using React and Node.", "skills", List.of("React", "Node.js", "TypeScript")));
                entities.add(Map.of("id", "102", "name", "Bob AI", "hourly_rate", 70.0, "headline", "AI/ML Engineer", "bio", "Expert in Python, PyTorch, and deploying LLMs.", "skills", List.of("Python", "AI/ML", "PyTorch", "NLP")));
                entities.add(Map.of("id", "103", "name", "Charlie Fullstack", "hourly_rate", 45.0, "headline", "Full Stack Developer", "bio", "Experienced in Java Spring Boot and React.", "skills", List.of("Java", "Spring Boot", "React", "PostgreSQL")));
            }
        }
        // -----------------------------------------

        Map<String,Object> req = Map.of(
            "project_title", p.getTitle(),
            "project_description", p.getDescription(),
            "project_skills", p.getSkillsRequired(),
            "project_type", "INDIVIDUAL", // Force INDIVIDUAL so Python AI doesn't run combinations on our fixed teams!
            "team_size", p.getTeamSize() != null ? p.getTeamSize() : 1,
            "freelancers", entities
        );
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            ResponseEntity<Map> res = restTemplate.postForEntity("http://localhost:8001/match", req, Map.class);
            return ResponseEntity.ok(res.getBody());
        } catch(Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    public record InviteRequest(String freelancerId) {}

    @PostMapping("/{id}/invite")
    @Operation(summary = "Invite a freelancer or team to a project")
    public ResponseEntity<?> inviteFreelancer(@PathVariable Long id, @RequestBody InviteRequest req, @AuthenticationPrincipal UserDetails ud) {
        Project p = projectService.getProject(id);
        User client = userRepository.findByEmail(ud.getUsername()).orElse(null);
        String clientName = client != null ? client.getFullName() : "A Client";

        if (p.getProjectType() != null && p.getProjectType().name().equals("TEAM")) {
            try {
                Long teamId = Long.parseLong(req.freelancerId());
                teamRepository.findById(teamId).ifPresent(team ->
                    notificationService.send(
                        team.getLeader(),
                        "Team Project Invitation",
                        clientName + " invited your team '" + team.getName() + "' to work on: " + p.getTitle() + ". Go to Teams tab to respond!",
                        "INFO"
                    )
                );
            } catch (Exception e) {}
        } else {
            try {
                UUID uId = UUID.fromString(req.freelancerId());
                userRepository.findById(uId).ifPresent(freelancer ->
                    notificationService.send(
                        freelancer,
                        "Project Invitation",
                        clientName + " invited you to bid on: " + p.getTitle(),
                        "INFO"
                    )
                );
            } catch (Exception e) {}
        }
        return ResponseEntity.ok(Map.of("message", "Invitation sent successfully"));
    }
}

