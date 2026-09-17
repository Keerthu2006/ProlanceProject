package com.trigrowth.service;

import com.trigrowth.model.Milestone;
import com.trigrowth.model.Payment;
import com.trigrowth.model.Project;
import com.trigrowth.model.User;
import com.trigrowth.repository.MilestoneRepository;
import com.trigrowth.repository.PaymentRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectRepository projectRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final com.trigrowth.repository.ApplicationRepository applicationRepository;
    private final com.trigrowth.repository.TeamRepository teamRepository;

    @Transactional
    public Milestone createMilestone(Long projectId, String title, String description, BigDecimal amount, Instant dueDate, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Only client who created project can add milestones
        if (!project.getClient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized to add milestones to this project");
        }

        // Validate due date
        if (project.getDueDate() != null && dueDate.isAfter(project.getDueDate())) {
            throw new RuntimeException("Milestone due date cannot exceed project due date");
        }

        List<Milestone> currentMilestones = milestoneRepository.findByProjectIdOrderByIdAsc(projectId);
        BigDecimal currentSum = currentMilestones.stream()
                .filter(m -> m.getStatus() != Milestone.Status.PENDING_FREELANCER_APPROVAL)
                .map(Milestone::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean exceedsCount = project.getNumberOfMilestones() != null && currentMilestones.size() >= project.getNumberOfMilestones();
        boolean exceedsBudget = project.getBudgetMax() != null && currentSum.add(amount).compareTo(project.getBudgetMax()) > 0;

        Milestone.Status initialStatus = Milestone.Status.TODO;
        if (exceedsCount || exceedsBudget) {
            initialStatus = Milestone.Status.PENDING_FREELANCER_APPROVAL;
        }

        Milestone milestone = Milestone.builder()
                .project(project)
                .title(title)
                .description(description)
                .amount(amount)
                .dueDate(dueDate)
                .status(initialStatus)
                .build();

        return milestoneRepository.save(milestone);
    }

    public List<Milestone> getProjectMilestones(Long projectId) {
        return milestoneRepository.findByProjectIdOrderByIdAsc(projectId);
    }

    public boolean isFreelancerAuthorizedForProject(Project project, User currentUser) {
        if (currentUser == null || project == null) return false;
        
        // 1. Directly hired freelancer or leader
        if (project.getHiredFreelancerId() != null && project.getHiredFreelancerId().equals(currentUser.getId())) {
            return true;
        }

        // 2. Team-based project check: user is leader OR member of accepted team
        return applicationRepository.findByProjectId(project.getId()).stream()
                .filter(a -> a.getStatus() == com.trigrowth.model.Application.Status.ACCEPTED && a.getTeamId() != null)
                .findFirst()
                .map(a -> teamRepository.findById(a.getTeamId())
                        .map(team -> (team.getLeader() != null && team.getLeader().getId().equals(currentUser.getId())) ||
                                     (team.getMembers() != null && team.getMembers().stream().anyMatch(m -> m.getId().equals(currentUser.getId()))))
                        .orElse(false))
                .orElse(false);
    }

    @Transactional
    public Milestone acceptExtraMilestone(Long milestoneId, User currentUser) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));
        Project project = milestone.getProject();
        
        if (!isFreelancerAuthorizedForProject(project, currentUser)) {
            throw new RuntimeException("Only assigned freelancer or team member can accept extra milestones");
        }

        if (milestone.getStatus() != Milestone.Status.PENDING_FREELANCER_APPROVAL) {
            throw new RuntimeException("Milestone is not pending approval");
        }

        milestone.setStatus(Milestone.Status.TODO);
        milestone = milestoneRepository.save(milestone);

        // Update project budget if total active milestones exceed it
        List<Milestone> activeMilestones = milestoneRepository.findByProjectIdOrderByIdAsc(project.getId());
        BigDecimal totalActiveSum = activeMilestones.stream()
                .filter(m -> m.getStatus() != Milestone.Status.PENDING_FREELANCER_APPROVAL)
                .map(Milestone::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (project.getBudgetMax() != null && totalActiveSum.compareTo(project.getBudgetMax()) > 0) {
            project.setBudgetMax(totalActiveSum);
            projectRepository.save(project);
        }

        return milestone;
    }

    @Transactional
    public void rejectExtraMilestone(Long milestoneId, User currentUser) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));
        Project project = milestone.getProject();
        
        if (!isFreelancerAuthorizedForProject(project, currentUser)) {
            throw new RuntimeException("Only assigned freelancer or team member can reject extra milestones");
        }

        if (milestone.getStatus() != Milestone.Status.PENDING_FREELANCER_APPROVAL) {
            throw new RuntimeException("Milestone is not pending approval");
        }

        milestoneRepository.delete(milestone);
    }

    @Transactional
    public Milestone updateStatus(Long milestoneId, Milestone.Status newStatus, String submissionNote, User currentUser) {
        return updateStatus(milestoneId, newStatus, submissionNote, null, null, null, null, currentUser);
    }

    @Transactional
    public Milestone updateStatus(Long milestoneId, Milestone.Status newStatus, String submissionNote,
                                 String githubPrUrl, String githubBranch,
                                 UUID assignedFreelancerId, String assignedFreelancerName,
                                 User currentUser) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));
        
        Project project = milestone.getProject();
        
        // Ensure user is hired freelancer OR member of the project team
        if (!isFreelancerAuthorizedForProject(project, currentUser)) {
            throw new RuntimeException("Only assigned freelancer or team member can update milestone status");
        }

        if (newStatus != null) {
            milestone.setStatus(newStatus);
        }
        if (submissionNote != null) {
            milestone.setSubmissionNote(submissionNote);
        }
        if (githubPrUrl != null && !githubPrUrl.isBlank()) {
            milestone.setGithubPrUrl(githubPrUrl);
        }
        if (githubBranch != null && !githubBranch.isBlank()) {
            milestone.setGithubBranch(githubBranch);
        }
        if (assignedFreelancerId != null) {
            milestone.setAssignedFreelancerId(assignedFreelancerId);
            milestone.setAssignedFreelancerName(assignedFreelancerName);
        }
        return milestoneRepository.save(milestone);
    }

    @Transactional
    public Milestone approveMilestone(Long milestoneId, User currentUser) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));
        Project project = milestone.getProject();

        if (!project.getClient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only client can approve milestone");
        }

        milestone.setStatus(Milestone.Status.DONE);
        milestone.setFeedback(null); // clear feedback

        // Create Payment
        if (project.getHiredFreelancerId() != null) {
            User payee = userRepository.findById(project.getHiredFreelancerId())
                    .orElseThrow(() -> new RuntimeException("Freelancer not found"));
            
            Payment payment = Payment.builder()
                    .project(project)
                    .payer(currentUser)
                    .payee(payee)
                    .amount(milestone.getAmount())
                    .status(Payment.Status.COMPLETED) // Immediate demo completion
                    .completedAt(Instant.now())
                    .build();
            paymentRepository.save(payment);
        }

        // Subtract from remaining project budget by adding to totalPaid
        if (project.getTotalPaid() == null) {
            project.setTotalPaid(BigDecimal.ZERO);
        }
        project.setTotalPaid(project.getTotalPaid().add(milestone.getAmount()));
        projectRepository.save(project);

        return milestoneRepository.save(milestone);
    }

    @Transactional
    public Milestone rejectMilestone(Long milestoneId, String feedback, User currentUser) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));
        Project project = milestone.getProject();

        if (!project.getClient().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only client can reject milestone");
        }

        milestone.setStatus(Milestone.Status.IN_PROGRESS);
        milestone.setFeedback(feedback);

        return milestoneRepository.save(milestone);
    }
}
