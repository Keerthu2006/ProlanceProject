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
    public Application apply(Long projectId, UUID freelancerId, String coverLetter, BigDecimal proposedAmount) {
        if (applicationRepository.existsByProjectIdAndFreelancerId(projectId, freelancerId)) {
            throw new RuntimeException("Already applied to this project");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        if (project.getStatus() != Project.Status.OPEN) {
            throw new RuntimeException("Project is not open for applications");
        }
        
        if (project.getProjectType() == Project.ProjectType.TEAM) {
            List<com.trigrowth.model.Team> ledTeams = teamRepository.findByLeaderId(freelancerId);
            if (ledTeams.isEmpty()) {
                throw new RuntimeException("You must be a team leader to bid on a Team project.");
            }
            com.trigrowth.model.Team team = ledTeams.get(0);
            int totalSize = team.getMembers().size() + 1; // +1 for the leader
            if (project.getTeamSize() != null && totalSize < project.getTeamSize()) {
                throw new RuntimeException("Your team size (" + totalSize + ") is smaller than the required team size (" + project.getTeamSize() + ").");
            }
        }

        User freelancer = userRepository.findById(freelancerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + freelancerId));

        Application application = Application.builder()
                .project(project)
                .freelancer(freelancer)
                .coverLetter(coverLetter)
                .proposedAmount(proposedAmount)
                .status(Application.Status.PENDING)
                .build();

        Application saved = applicationRepository.save(application);
        log.info("Application {} created for project {} by freelancer {}", saved.getId(), projectId, freelancerId);
        return saved;
    }

    public List<Application> getProjectApplications(Long projectId) {
        return applicationRepository.findByProjectId(projectId);
    }

    public List<Application> getMyApplications(UUID freelancerId) {
        return applicationRepository.findByFreelancerId(freelancerId);
    }
}
