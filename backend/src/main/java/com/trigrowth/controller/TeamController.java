package com.trigrowth.controller;

import com.trigrowth.model.Project;
import com.trigrowth.model.Team;
import com.trigrowth.model.User;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.service.ProjectService;
import com.trigrowth.service.TeamService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Freelancer team management")
public class TeamController {

    private final TeamService    teamService;
    private final UserRepository userRepository;
    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<Team> createTeam(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody CreateTeamRequest req) {
        User leader = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return ResponseEntity.status(HttpStatus.CREATED).body(
                teamService.createTeam(leader.getId(), req.name(), req.memberIds()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<Set<User>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getMembers(id));
    }

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getTeam(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeam(id));
    }

    /**
     * Returns ALL teams the current user belongs to — whether they are the leader OR just a member.
     * This fixes the bug where Freelancer 2 (non-leader) couldn't see their teams.
     */
    @GetMapping("/mine")
    public ResponseEntity<List<Team>> getMyTeams(@AuthenticationPrincipal UserDetails ud) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return ResponseEntity.ok(teamService.getTeamsForUser(user.getId()));
    }

    /**
     * Returns all projects that the given team has been accepted into.
     * Visible to all members of that team.
     */
    @GetMapping("/{id}/projects")
    public ResponseEntity<List<Project>> getTeamProjects(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return ResponseEntity.ok(projectService.getProjectsForTeam(id, user.getId()));
    }

    public record CreateTeamRequest(String name, List<UUID> memberIds) {}
}
