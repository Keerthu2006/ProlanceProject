package com.trigrowth.controller;

import com.trigrowth.model.*;
import com.trigrowth.repository.*;
import com.trigrowth.service.RecommendationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/owner")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER','ADMIN')")
@Tag(name = "Owner Dashboard", description = "TriGrowth AI owner intelligence endpoints")
public class OwnerController {

    private final RecommendationService       recommendationService;
    private final ProjectRepository           projectRepository;
    private final UserRepository              userRepository;
    private final AgentResultRepository       agentResultRepository;
    private final AutomationActionRepository  automationActionRepository;
    private final BusinessEventRepository     businessEventRepository;
    private final RevenueSnapshotRepository   revenueSnapshotRepository;
    private final FreelancerProfileRepository profileRepository;
    private final FeatureUsageLogRepository   featureUsageLogRepository;
    private final ApplicationRepository       applicationRepository;
    private final ReviewRepository            reviewRepository;
    private final TeamRepository              teamRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("total_projects",    projectRepository.count());
        summary.put("open_projects",     projectRepository.countByStatus(Project.Status.OPEN));
        summary.put("total_clients",     userRepository.countByRole(Role.ROLE_CLIENT));
        summary.put("total_freelancers", userRepository.countByRole(Role.ROLE_FREELANCER));
        for (String agent : List.of("CustomerNeglectAgent","ProductNeglectAgent","FinancialNeglectAgent","OpportunityNeglectAgent","FreelancerNeglectAgent")) {
            String key = agentKey(agent);
            agentResultRepository.findFirstByAgentNameOrderByCreatedAtDesc(agent).ifPresent(r -> {
                summary.put(key + "_severity", r.getSeverity());
                summary.put(key + "_score",    r.getScore());
                summary.put(key + "_summary",  r.getSummary());
            });
        }
        return ResponseEntity.ok(summary);
    }

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

    @GetMapping("/automation-log")
    public ResponseEntity<List<AutomationAction>> getAutomationLog() {
        return ResponseEntity.ok(automationActionRepository.findAllByOrderByExecutedAtDesc());
    }

    @GetMapping("/events")
    public ResponseEntity<List<BusinessEvent>> getEvents() {
        return ResponseEntity.ok(businessEventRepository.findTop50ByOrderByCreatedAtDesc());
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<RevenueSnapshot>> getRevenue() {
        return ResponseEntity.ok(revenueSnapshotRepository.findAllByOrderByMonthDesc());
    }

    @GetMapping("/agents/{name}/results")
    public ResponseEntity<List<AgentResult>> getAgentResults(@PathVariable String name) {
        return ResponseEntity.ok(agentResultRepository.findByAgentNameOrderByCreatedAtDesc(name));
    }

    // -- Neglect Intelligence --------------------------------------

    @GetMapping("/neglect/freelancers")
    public ResponseEntity<List<Map<String, Object>>> getNeglectFreelancers() {
        return ResponseEntity.ok(userRepository.findFreelancersIgnoringClients(1));
    }

    @GetMapping("/neglect/customers")
    public ResponseEntity<List<Map<String, Object>>> getNeglectCustomers() {
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);
        List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
        List<Map<String, Object>> result = clients.stream().map(client -> {
            Instant lastActivity = client.getLastLoginAt() != null ? client.getLastLoginAt() : client.getCreatedAt();
            long daysInactive = lastActivity != null ? ChronoUnit.DAYS.between(lastActivity, now) : 999L;
            long projects30d = projectRepository.countByClient_IdAndCreatedAtAfter(client.getId(), thirtyDaysAgo);
            long completedProjects = projectRepository.countByClient_IdAndStatus(client.getId(), Project.Status.COMPLETED);
            String risk; int score;
            if (daysInactive > 60)                          { risk = "CRITICAL"; score = 85; }
            else if (daysInactive > 30)                     { risk = "HIGH";     score = 65; }
            else if (daysInactive > 14 && projects30d == 0) { risk = "MEDIUM";   score = 45; }
            else if (daysInactive > 7  && projects30d == 0) { risk = "LOW";      score = 25; }
            else                                            { risk = "HEALTHY";  score = 5;  }
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("id",                client.getId().toString());
            e.put("name",              client.getFullName());
            e.put("email",             client.getEmail());
            e.put("lastActive",        daysInactive);
            e.put("lastLoginAt",       lastActivity != null ? lastActivity.toString() : null);
            e.put("projects30d",       projects30d);
            e.put("completedProjects", completedProjects);
            e.put("risk",              risk);
            e.put("score",             score);
            return e;
        }).sorted(Comparator.comparingInt(m -> -((int) m.get("score")))).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/neglect/features")
    public ResponseEntity<List<Map<String, Object>>> getNeglectFeatures() {
        long fl = Math.max(1, userRepository.countByRole(Role.ROLE_FREELANCER));
        long cl = Math.max(1, userRepository.countByRole(Role.ROLE_CLIENT));
        long all = fl + cl;
        List<Map<String, Object>> features = new ArrayList<>();
        features.add(featureEntry("Bid System",  pct(applicationRepository.count(), fl)));
        features.add(featureEntry("Projects",     pct(projectRepository.count(),    cl)));
        features.add(featureEntry("Reviews",      pct(reviewRepository.count(),     all)));
        features.add(featureEntry("Teams",        pct(teamRepository.count(),       fl)));
        features.add(featureEntry("AI Chat",      pct(featureUsageLogRepository.countByFeatureKey("ai_chat"), all)));
        features.add(featureEntry("Market Intel", pct(featureUsageLogRepository.countByFeatureKey("market_intel"), all)));
        return ResponseEntity.ok(features);
    }

    @GetMapping("/neglect/revenue")
    public ResponseEntity<List<Map<String, Object>>> getNeglectRevenue() {
        List<RevenueSnapshot> snaps = revenueSnapshotRepository.findAllByOrderByMonthDesc();
        Collections.reverse(snaps);
        List<Map<String, Object>> result = new ArrayList<>();
        for (RevenueSnapshot s : snaps) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("month", s.getMonth()); p.put("actual", s.getTotalRevenue().doubleValue());
            result.add(p);
        }
        if (snaps.size() >= 2) {
            double last = snaps.get(snaps.size()-1).getTotalRevenue().doubleValue();
            double prev = snaps.get(snaps.size()-2).getTotalRevenue().doubleValue();
            double growth = Math.max(-0.3, Math.min(last > 0 ? (last-prev)/last : 0.05, 0.3));
            double predicted = last;
            for (String m : new String[]{"Next+1","Next+2","Next+3"}) {
                predicted = predicted * (1 + growth);
                Map<String, Object> p = new LinkedHashMap<>();
                p.put("month", m); p.put("predicted", Math.round(predicted*100.0)/100.0);
                result.add(p);
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/neglect/opportunities")
    public ResponseEntity<List<Map<String, Object>>> getNeglectOpportunities() {
        Map<String, Long> skillCount = new HashMap<>();
        for (FreelancerProfile p : profileRepository.findAll())
            for (String skill : p.getSkills())
                skillCount.merge(normalizeSkill(skill), 1L, Long::sum);
        long total = Math.max(1, userRepository.countByRole(Role.ROLE_FREELANCER));
        List<Map<String, Object>> result = skillCount.entrySet().stream()
            .sorted(Map.Entry.<String,Long>comparingByValue().reversed()).limit(10)
            .map(e -> {
                int demand = (int) Math.min(99, (e.getValue()*100)/total);
                Map<String,Object> m = new LinkedHashMap<>();
                m.put("domain", e.getKey()); m.put("demand", demand);
                m.put("count", e.getValue()); m.put("predicted6m", Math.min(99, demand+(demand>50?4:8)));
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // -- Helpers ---------------------------------------------------

    private String agentKey(String n) {
        return switch (n) {
            case "CustomerNeglectAgent"    -> "customer";
            case "ProductNeglectAgent"     -> "product";
            case "FinancialNeglectAgent"   -> "financial";
            case "OpportunityNeglectAgent" -> "opportunity";
            case "FreelancerNeglectAgent"  -> "freelancer";
            default -> n.toLowerCase();
        };
    }
    private static Map<String,Object> featureEntry(String f, int a) {
        Map<String,Object> m=new LinkedHashMap<>(); m.put("feature",f); m.put("adoption",a); return m;
    }
    private static int pct(long count, long total) {
        return total==0?0:(int)Math.min(100,(count*100)/total);
    }
    private static String normalizeSkill(String raw) {
        String s = raw.toLowerCase().trim();
        if (s.contains("react")||s.contains("next")||s.contains("vue")||s.contains("angular"))   return "React/Next.js";
        if (s.contains("python")||s.contains("ml")||s.contains("ai")||s.contains("tensorflow")||s.contains("machine learning")) return "AI/ML";
        if (s.contains("node")||s.contains("express")||s.contains("spring")||s.contains("java")||s.contains("backend")) return "Backend Dev";
        if (s.contains("aws")||s.contains("azure")||s.contains("docker")||s.contains("kubernetes")||s.contains("devops")||s.contains("cloud")) return "DevOps/Cloud";
        if (s.contains("flutter")||s.contains("swift")||s.contains("kotlin")||s.contains("android")||s.contains("ios")||s.contains("react native")) return "Mobile";
        if (s.contains("blockchain")||s.contains("solidity")||s.contains("web3")||s.contains("crypto")) return "Blockchain";
        if (s.contains("figma")||s.contains("ui")||s.contains("ux")||s.contains("design"))        return "UI/UX Design";
        if (s.contains("data")||s.contains("sql")||s.contains("analytics")||s.contains("tableau")) return "Data/Analytics";
        if (s.contains("ar")||s.contains("vr")||s.contains("unity")||s.contains("unreal"))        return "AR/VR";
        if (s.contains("seo")||s.contains("marketing")||s.contains("content")||s.contains("social")) return "Digital Marketing";
        return raw.length()>20?raw.substring(0,20):raw;
    }

    // ── Alias endpoints so frontend routes work with both singular/plural ──
    @GetMapping("/neglect/product")
    public ResponseEntity<?> getNeglectProductAlias() {
        return getNeglectFeatures();
    }

    @GetMapping("/neglect/opportunity")
    public ResponseEntity<?> getNeglectOpportunityAlias() {
        return getNeglectOpportunities();
    }
}

