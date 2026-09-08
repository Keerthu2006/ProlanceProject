package com.trigrowth.service;

import com.trigrowth.dto.ProjectRequest;
import com.trigrowth.model.Application;
import com.trigrowth.model.Project;
import com.trigrowth.model.RevenueSnapshot;
import com.trigrowth.model.User;
import com.trigrowth.repository.ApplicationRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.RevenueSnapshotRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final RevenueSnapshotRepository revenueSnapshotRepository;
    private final EventCollectorService eventCollectorService;
    private final com.trigrowth.repository.TeamRepository teamRepository;

    public List<Project> getOpenProjects() {
        return projectRepository.findByStatus(Project.Status.OPEN);
    }

    @Transactional
    public Project createProject(UUID clientId, ProjectRequest request) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("User not found: " + clientId));

        if (request.dueDate() != null && request.dueDate().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Project submission deadline must be a future date.");
        }

        Project.ProjectType type = Project.ProjectType.INDIVIDUAL;
        if (request.projectType() != null && request.projectType().equalsIgnoreCase("TEAM")) {
            type = Project.ProjectType.TEAM;
        }

        Project project = Project.builder()
                .owner(client)
                .client(client)
                .title(request.title())
                .description(request.description())
                .budgetMin(request.budgetMin())
                .budgetMax(request.budgetMax())
                .skillsRequired(request.skillsRequired() != null ? request.skillsRequired() : List.of())
                .durationDays(request.durationDays())
                .numberOfMilestones(request.numberOfMilestones())
                .dueDate(request.dueDate())
                .projectType(type)
                .teamSize(type == Project.ProjectType.TEAM ? request.teamSize() : null)
                .status(Project.Status.OPEN)
                .totalPaid(BigDecimal.ZERO)
                .build();

        Project saved = projectRepository.save(project);
        log.info("Project created: {} by client {}", saved.getId(), clientId);

        try {
            eventCollectorService.emit("PROJECT_CREATED", "PROJECT", saved.getId(),
                    Map.of("title", saved.getTitle(), "clientId", clientId.toString()));
        } catch (Exception e) {
            log.warn("Failed to emit PROJECT_CREATED event", e);
        }
        return saved;
    }

    public List<Project> getMyProjects(UUID clientId) {
        return projectRepository.findByClient_Id(clientId);
    }

    public List<Project> getAssignedProjects(UUID freelancerId) {
        // Combine individual + team projects for a full picture
        List<Project> result = new java.util.ArrayList<>();
        result.addAll(getIndividualProjects(freelancerId));
        result.addAll(getTeamProjectsForUser(freelancerId));
        return result.stream().distinct().toList();
    }

    /**
     * Returns enriched assigned projects with teamId injected for frontend milestone calculation.
     */
    public List<Map<String, Object>> getAssignedProjectsEnriched(UUID freelancerId) {
        List<Map<String, Object>> result = new java.util.ArrayList<>();

        // Individual (solo) projects
        applicationRepository.findByFreelancerId(freelancerId).stream()
                .filter(a -> a.getStatus() == Application.Status.ACCEPTED && a.getTeamId() == null)
                .forEach(a -> {
                    Map<String, Object> entry = projectToMap(a.getProject());
                    entry.put("teamId", null);
                    result.add(entry);
                });

        // Team projects (member or leader)
        List<com.trigrowth.model.Team> myTeams = teamRepository.findByMemberId(freelancerId);
        for (com.trigrowth.model.Team team : myTeams) {
            UUID leaderId = team.getLeader().getId();
            applicationRepository.findByFreelancerId(leaderId).stream()
                    .filter(a -> a.getStatus() == Application.Status.ACCEPTED
                            && a.getTeamId() != null
                            && a.getTeamId().equals(team.getId()))
                    .forEach(a -> {
                        Map<String, Object> entry = projectToMap(a.getProject());
                        entry.put("teamId", team.getId());
                        entry.put("teamName", team.getName());
                        entry.put("teamMemberCount", team.getMembers().size());
                        // Already in result? skip duplicates
                        boolean alreadyAdded = result.stream().anyMatch(r ->
                                r.get("id") != null && r.get("id").equals(entry.get("id"))
                                && team.getId().equals(r.get("teamId")));
                        if (!alreadyAdded) result.add(entry);
                    });
        }
        return result;
    }

    private Map<String, Object> projectToMap(Project p) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("title", p.getTitle());
        m.put("description", p.getDescription());
        m.put("budgetMin", p.getBudgetMin());
        m.put("budgetMax", p.getBudgetMax());
        m.put("status", p.getStatus() != null ? p.getStatus().name() : null);
        m.put("projectType", p.getProjectType() != null ? p.getProjectType().name() : "INDIVIDUAL");
        m.put("teamSize", p.getTeamSize());
        m.put("durationDays", p.getDurationDays());
        m.put("skillsRequired", p.getSkillsRequired());
        m.put("clientId", p.getClientId());
        m.put("clientName", p.getClientName());
        m.put("submissionNote", p.getSubmissionNote());
        m.put("revisionNote", p.getRevisionNote());
        return m;
    }

    /**
     * Solo projects: accepted applications where the teamId is null (individual bid).
     */
    public List<Project> getIndividualProjects(UUID freelancerId) {
        return applicationRepository.findByFreelancerId(freelancerId).stream()
                .filter(a -> a.getStatus() == Application.Status.ACCEPTED && a.getTeamId() == null)
                .map(Application::getProject)
                .distinct()
                .toList();
    }

    /**
     * Team projects: finds all teams the freelancer belongs to (member OR leader),
     * then returns all projects those teams have accepted bids on.
     */
    public List<Project> getTeamProjectsForUser(UUID freelancerId) {
        // All teams this user belongs to (leader or member)
        List<com.trigrowth.model.Team> myTeams = teamRepository.findByMemberId(freelancerId);
        List<Project> teamProjects = new java.util.ArrayList<>();

        for (com.trigrowth.model.Team team : myTeams) {
            // The leader is the one who submitted the bid (application)
            UUID leaderId = team.getLeader().getId();
            // Find accepted applications by the leader that were submitted on behalf of this team
            applicationRepository.findByFreelancerId(leaderId).stream()
                    .filter(a -> a.getStatus() == Application.Status.ACCEPTED
                            && a.getTeamId() != null
                            && a.getTeamId().equals(team.getId()))
                    .map(Application::getProject)
                    .forEach(teamProjects::add);
        }
        return teamProjects.stream().distinct().toList();
    }

    /**
     * Returns all projects that a specific team has been accepted on.
     * Used by GET /teams/{id}/projects — visible to all members of that team.
     */
    public List<Project> getProjectsForTeam(Long teamId, UUID requestingUserId) {
        com.trigrowth.model.Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId));

        // Security: ensure the requesting user is actually a member of this team
        boolean isMember = team.getMembers().stream().anyMatch(m -> m.getId().equals(requestingUserId));
        if (!isMember) {
            throw new RuntimeException("Access denied: you are not a member of this team");
        }

        // Return accepted projects for the team leader's applications linked to this team
        UUID leaderId = team.getLeader().getId();
        return applicationRepository.findByFreelancerId(leaderId).stream()
                .filter(a -> a.getStatus() == Application.Status.ACCEPTED
                        && a.getTeamId() != null
                        && a.getTeamId().equals(teamId))
                .map(Application::getProject)
                .distinct()
                .toList();
    }


    public Project getProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found: " + id));
    }

    @Transactional
    public Project hireFreelancer(Long projectId, UUID freelancerId, UUID clientId) {
        Project project = getProject(projectId);
        if (!project.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Not authorized to hire on this project");
        }

        // Accept the matching application and update project budget
        applicationRepository.findByProjectId(projectId).stream()
                .filter(a -> a.getFreelancer().getId().equals(freelancerId))
                .findFirst()
                .ifPresent(a -> {
                    a.setStatus(Application.Status.ACCEPTED);
                    applicationRepository.save(a);
                    
                    if (a.getProposedAmount() != null) {
                        project.setBudgetMax(a.getProposedAmount());
                        project.setBudgetMin(a.getProposedAmount());
                    }
                });

        // Reject all other pending applications
        applicationRepository.findByProjectId(projectId).stream()
                .filter(a -> !a.getFreelancer().getId().equals(freelancerId))
                .filter(a -> a.getStatus() == Application.Status.PENDING)
                .forEach(a -> {
                    a.setStatus(Application.Status.REJECTED);
                    applicationRepository.save(a);
                });

        project.setStatus(Project.Status.IN_PROGRESS);
        project.setHiredFreelancerId(freelancerId);
        return projectRepository.save(project);
    }

    @Transactional
    public void rejectFreelancer(Long projectId, UUID freelancerId, UUID clientId) {
        Project project = getProject(projectId);
        if (!project.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Not authorized to reject on this project");
        }

        applicationRepository.findByProjectId(projectId).stream()
                .filter(a -> a.getFreelancer().getId().equals(freelancerId))
                .findFirst()
                .ifPresent(a -> {
                    a.setStatus(Application.Status.REJECTED);
                    applicationRepository.save(a);
                });
    }

    /** Freelancer submits their work for client review */
    @Transactional
    public Project submitForReview(Long projectId, UUID freelancerId, String note) {
        Project project = getProject(projectId);
        // Verify the freelancer is actually assigned
        boolean isAssigned = applicationRepository.findByProjectId(projectId).stream()
                .anyMatch(a -> a.getFreelancer().getId().equals(freelancerId)
                        && a.getStatus() == Application.Status.ACCEPTED);
        if (!isAssigned) {
            throw new RuntimeException("Freelancer is not assigned to this project");
        }
        if (project.getStatus() != Project.Status.IN_PROGRESS) {
            throw new RuntimeException("Project must be IN_PROGRESS to submit for review");
        }
        project.setStatus(Project.Status.UNDER_REVIEW);
        project.setSubmissionNote(note);
        project.setRevisionNote(null);
        return projectRepository.save(project);
    }

    /** Client approves the submission → COMPLETED + revenue updated */
    @Transactional
    public Project approveCompletion(Long projectId, UUID clientId) {
        Project project = getProject(projectId);
        if (!project.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Not authorized to approve this project");
        }
        if (project.getStatus() != Project.Status.UNDER_REVIEW) {
            throw new RuntimeException("Project must be UNDER_REVIEW to approve");
        }
        project.setStatus(Project.Status.COMPLETED);
        Project saved = projectRepository.save(project);
        updateRevenueSnapshot(saved);
        
        try {
            eventCollectorService.emit("PROJECT_COMPLETED", "PROJECT", saved.getId(),
                    Map.of("title", saved.getTitle(), "clientId", clientId.toString(), "freelancerId", saved.getHiredFreelancerId().toString()));
        } catch (Exception e) {
            log.warn("Failed to emit PROJECT_COMPLETED event", e);
        }
        
        log.info("Project {} approved and completed by client {}", projectId, clientId);
        return saved;
    }

    /** Client requests revision → back to IN_PROGRESS with a note */
    @Transactional
    public Project requestRevision(Long projectId, UUID clientId, String revisionNote) {
        Project project = getProject(projectId);
        if (!project.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Not authorized on this project");
        }
        if (project.getStatus() != Project.Status.UNDER_REVIEW) {
            throw new RuntimeException("Project must be UNDER_REVIEW to request revision");
        }
        project.setStatus(Project.Status.IN_PROGRESS);
        project.setRevisionNote(revisionNote);
        project.setSubmissionNote(null);
        return projectRepository.save(project);
    }

    @Transactional
    public Project completeProject(Long id) {
        Project project = getProject(id);
        project.setStatus(Project.Status.COMPLETED);
        Project saved = projectRepository.save(project);
        updateRevenueSnapshot(saved);
        return saved;
    }

    @Transactional
    public Project cancelProject(Long id) {
        Project project = getProject(id);
        project.setStatus(Project.Status.CANCELLED);
        return projectRepository.save(project);
    }

    private void updateRevenueSnapshot(Project project) {
        String month = YearMonth.now().toString(); // e.g. "2024-07"
        BigDecimal projectValue = project.getBudgetMax() != null ? project.getBudgetMax()
                : project.getBudgetMin() != null ? project.getBudgetMin() : BigDecimal.ZERO;

        RevenueSnapshot snapshot = revenueSnapshotRepository.findByMonth(month)
                .orElseGet(() -> RevenueSnapshot.builder()
                        .month(month)
                        .totalRevenue(BigDecimal.ZERO)
                        .contractCount(0)
                        .avgContractValue(BigDecimal.ZERO)
                        .build());

        snapshot.setTotalRevenue(snapshot.getTotalRevenue().add(projectValue));
        snapshot.setContractCount(snapshot.getContractCount() + 1);
        if (snapshot.getContractCount() > 0) {
            snapshot.setAvgContractValue(
                    snapshot.getTotalRevenue().divide(
                            BigDecimal.valueOf(snapshot.getContractCount()), 2, RoundingMode.HALF_UP));
        }
        revenueSnapshotRepository.save(snapshot);
        log.info("RevenueSnapshot updated for month {}: total={}", month, snapshot.getTotalRevenue());
    }
}
