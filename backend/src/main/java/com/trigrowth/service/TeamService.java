package com.trigrowth.service;

import com.trigrowth.model.FeatureUsageLog;
import com.trigrowth.model.Team;
import com.trigrowth.model.User;
import com.trigrowth.repository.FeatureUsageLogRepository;
import com.trigrowth.repository.TeamRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamService {

    private final TeamRepository          teamRepository;
    private final UserRepository          userRepository;
    private final FeatureUsageLogRepository featureUsageLogRepository;

    public Team createTeam(UUID leaderId, String name, List<UUID> memberIds) {
        User leader = userRepository.findById(leaderId)
                .orElseThrow(() -> new IllegalArgumentException("Leader not found: " + leaderId));

        Set<User> members = new HashSet<>();
        members.add(leader);
        if (memberIds != null) {
            for (UUID mid : memberIds) {
                userRepository.findById(mid).ifPresent(members::add);
            }
        }

        Team team = Team.builder()
                .name(name)
                .leader(leader)
                .members(members)
                .createdAt(Instant.now())
                .build();

        teamRepository.save(team);

        // Log TEAM_CREATION feature usage
        FeatureUsageLog log = FeatureUsageLog.builder()
                .freelancer(leader)
                .featureKey("TEAM_CREATION")
                .usedAt(Instant.now())
                .build();
        featureUsageLogRepository.save(log);

        return team;
    }

    @Transactional(readOnly = true)
    public Set<User> getMembers(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));
        return team.getMembers();
    }

    @Transactional(readOnly = true)
    public Team getTeam(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsByLeader(UUID leaderId) {
        return teamRepository.findByLeaderId(leaderId);
    }
}
