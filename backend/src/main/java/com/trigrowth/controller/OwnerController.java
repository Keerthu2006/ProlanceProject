package com.trigrowth.controller;

import com.trigrowth.model.*;
import com.trigrowth.repository.*;
import com.trigrowth.service.RecommendationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/owner")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER','ADMIN')")
@Tag(name = "Owner Dashboard", description = "TriGrowth AI owner intelligence endpoints")
public class OwnerController {

    private final RecommendationService      recommendationService;
    private final ProjectRepository          projectRepository;
    private final UserRepository             userRepository;
    private final AgentResultRepository      agentResultRepository;
    private final AutomationActionRepository automationActionRepository;
    private final BusinessEventRepository    businessEventRepository;
    private final RevenueSnapshotRepository  revenueSnapshotRepository;

    // ── Dashboard Summary ─────────────────────────────────────────

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Map<String, Object> summary = new HashMap<>();

        // Platform stats
        summary.put("total_projects",    projectRepository.count());
        summary.put("open_projects",     projectRepository.countByStatus(Project.Status.OPEN));
        summary.put("total_clients",     userRepository.countByRole(com.trigrowth.model.Role.ROLE_CLIENT));
        summary.put("total_freelancers", userRepository.countByRole(com.trigrowth.model.Role.ROLE_FREELANCER));

        // Latest agent scores (grab most recent result per agent)
        for (String agent : List.of("CustomerNeglectAgent","ProductNeglectAgent",
                                     "FinancialNeglectAgent","OpportunityNeglectAgent")) {
            String key = agentKey(agent);
            agentResultRepository.findFirstByAgentNameOrderByCreatedAtDesc(agent)
                    .ifPresent(r -> {
                        summary.put(key + "_severity", r.getSeverity());
                        summary.put(key + "_score",    r.getScore());
                        summary.put(key + "_summary",  r.getSummary());
                    });
        }

        return ResponseEntity.ok(summary);
    }

    // ── Recommendations ───────────────────────────────────────────

    @GetMapping("/recommendations/pending")
    public ResponseEntity<List<Recommendation>> getPending() {
        return ResponseEntity.ok(recommendationService.getPendingRecommendations());
    }

    @GetMapping("/recommendations/history")
    public ResponseEntity<List<Recommendation>> getHistory() {
        return ResponseEntity.ok(recommendationService.getAllRecommendations());
    }

    @PostMapping("/recommendations/{id}/approve")
    public ResponseEntity<Recommendation> approve(@PathVariable Long id) {
        return ResponseEntity.ok(recommendationService.approveRecommendation(id));
    }

    @PostMapping("/recommendations/{id}/reject")
    public ResponseEntity<Recommendation> reject(@PathVariable Long id) {
        return ResponseEntity.ok(recommendationService.rejectRecommendation(id));
    }

    // ── Automation Log ────────────────────────────────────────────

    @GetMapping("/automation-log")
    public ResponseEntity<List<AutomationAction>> getAutomationLog() {
        return ResponseEntity.ok(automationActionRepository.findAllByOrderByExecutedAtDesc());
    }

    // ── Event Feed ────────────────────────────────────────────────

    @GetMapping("/events")
    public ResponseEntity<List<BusinessEvent>> getEvents() {
        return ResponseEntity.ok(businessEventRepository.findTop50ByOrderByCreatedAtDesc());
    }

    // ── Revenue ───────────────────────────────────────────────────

    @GetMapping("/revenue")
    public ResponseEntity<List<RevenueSnapshot>> getRevenue() {
        return ResponseEntity.ok(revenueSnapshotRepository.findAllByOrderByMonthDesc());
    }

    // ── Agent Results ─────────────────────────────────────────────

    @GetMapping("/agents/{name}/results")
    public ResponseEntity<List<AgentResult>> getAgentResults(@PathVariable String name) {
        return ResponseEntity.ok(
                agentResultRepository.findByAgentNameOrderByCreatedAtDesc(name));
    }

    // ── Helpers ───────────────────────────────────────────────────

    private String agentKey(String agentName) {
        return switch (agentName) {
            case "CustomerNeglectAgent"    -> "customer";
            case "ProductNeglectAgent"     -> "product";
            case "FinancialNeglectAgent"   -> "financial";
            case "OpportunityNeglectAgent" -> "opportunity";
            default -> agentName.toLowerCase();
        };
    }
}
