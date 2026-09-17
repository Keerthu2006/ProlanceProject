package com.trigrowth.service;

import com.trigrowth.model.Application;
import com.trigrowth.model.Project;
import com.trigrowth.model.User;
import com.trigrowth.repository.ApplicationRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final com.trigrowth.repository.TeamRepository teamRepository;

    @Transactional
    public Application apply(Long projectId, UUID freelancerId, String coverLetter, BigDecimal proposedAmount, Long teamId) {
        if (applicationRepository.existsByProjectIdAndFreelancerId(projectId, freelancerId)) {
            throw new IllegalArgumentException("Already applied to this project");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        if (project.getStatus() != Project.Status.OPEN) {
            throw new RuntimeException("Project is not open for applications");
        }

        // If bidding as a team, validate leadership and team size
        if (teamId != null) {
            com.trigrowth.model.Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found: " + teamId));
            if (!team.getLeader().getId().equals(freelancerId)) {
                throw new RuntimeException("Only the team leader can submit a bid on behalf of the team.");
            }
            if (project.getTeamSize() != null && team.getMembers().size() < project.getTeamSize()) {
                throw new RuntimeException("Your team size (" + team.getMembers().size() + ") is smaller than the required team size (" + project.getTeamSize() + ").");
            }
        } else if (project.getProjectType() == Project.ProjectType.TEAM) {
            // For TEAM projects, a teamId is required
            throw new RuntimeException("This is a team project. Please select a team to bid with.");
        }

        User freelancer = userRepository.findById(freelancerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + freelancerId));

        Application application = Application.builder()
                .project(project)
                .freelancer(freelancer)
                .coverLetter(coverLetter)
                .proposedAmount(proposedAmount)
                .teamId(teamId)
                .status(Application.Status.PENDING)
                .build();

        Application saved = applicationRepository.save(application);
        log.info("Application {} created for project {} by freelancer {} (teamId={})", saved.getId(), projectId, freelancerId, teamId);
        return saved;
    }

    public List<Application> getProjectApplications(Long projectId) {
        return applicationRepository.findByProjectId(projectId);
    }

    public List<Application> getMyApplications(UUID freelancerId) {
        return applicationRepository.findByFreelancerId(freelancerId);
    }
}
