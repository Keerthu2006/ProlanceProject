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
    private final MilestoneRepository         milestoneRepository;
    private final PaymentRepository           paymentRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

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

    @PostMapping("/automations/manual-trigger")
    public ResponseEntity<Map<String, Object>> manualTrigger(@RequestBody Map<String, String> payload) {
        String actionType = payload.get("actionType");
        String detail = payload.get("detail");
        
        messagingTemplate.convertAndSend("/topic/automation-log", Map.of(
                "actionType", actionType,
                "actionDetail", detail,
                "success", true,
                "timestamp", java.time.Instant.now().toString()
        ));
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Action triggered: " + actionType));
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
        
        // Fetch BOTH clients and freelancers for overall Customer Neglect
        List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
        List<User> freelancers = userRepository.findAllByRole(Role.ROLE_FREELANCER);
        List<User> allUsers = new ArrayList<>();
        allUsers.addAll(clients);
        allUsers.addAll(freelancers);
        
        List<Map<String, Object>> featuresList = new ArrayList<>();
        List<Map<String, Object>> baseResults = new ArrayList<>();

        for (User user : allUsers) {
            Instant lastActivity = user.getLastLoginAt() != null ? user.getLastLoginAt() : user.getCreatedAt();
            long daysInactive = lastActivity != null ? ChronoUnit.DAYS.between(lastActivity, now) : 999L;
            
            long projects30d;
            long totalProjects;
            long completedProjects;
            
            if (user.getRole() == Role.ROLE_CLIENT) {
                projects30d = projectRepository.countByClient_IdAndCreatedAtAfter(user.getId(), thirtyDaysAgo);
                totalProjects = projectRepository.countByClient_Id(user.getId());
                completedProjects = projectRepository.countByClient_IdAndStatus(user.getId(), Project.Status.COMPLETED);
            } else {
                projects30d = applicationRepository.countByFreelancerIdAndAppliedAtAfter(user.getId(), thirtyDaysAgo);
                totalProjects = applicationRepository.countByFreelancerId(user.getId());
                completedProjects = applicationRepository.findByFreelancerId(user.getId()).stream()
                    .filter(a -> a.getProject().getStatus() == Project.Status.COMPLETED && a.getStatus() == Application.Status.ACCEPTED)
                    .count();
            }
            
            // Prepare features for ML Model
            Map<String, Object> feature = new HashMap<>();
            feature.put("id", user.getId().toString());
            feature.put("days_inactive", daysInactive);
            feature.put("projects_30d", projects30d);
            feature.put("total_projects", totalProjects);
            feature.put("is_freelancer", user.getRole() == Role.ROLE_FREELANCER ? 1 : 0);
            featuresList.add(feature);

            Map<String, Object> e = new LinkedHashMap<>();
            e.put("id", user.getId().toString());
            e.put("name", user.getFullName());
            e.put("email", user.getEmail());
            e.put("role", user.getRole() == Role.ROLE_FREELANCER ? "Freelancer" : "Client");
            e.put("lastActive", daysInactive);
            e.put("lastLoginAt", lastActivity != null ? lastActivity.toString() : null);
            e.put("projects30d", projects30d);
            e.put("completedProjects", completedProjects);
            baseResults.add(e);
        }

        // Call the ML Python Service
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            Map<String, Object> reqBody = Map.of("customers", featuresList);
            Map<String, Object> aiResponse = restTemplate.postForObject(
                "http://localhost:8001/predict-customer-neglect-batch", 
                reqBody, 
                Map.class
            );

            if (aiResponse != null && aiResponse.containsKey("results")) {
                List<Map<String, Object>> mlResults = (List<Map<String, Object>>) aiResponse.get("results");
                for (Map<String, Object> mlRes : mlResults) {
                    String id = (String) mlRes.get("id");
                    for (Map<String, Object> base : baseResults) {
                        if (base.get("id").equals(id)) {
                            base.put("risk", mlRes.get("risk"));
                            base.put("score", mlRes.get("score"));
                            base.put("churnProb", mlRes.get("churn_prob"));
                            break;
                        }
                    }
                }
            }
        } catch (Exception ex) {
            // Fallback to basic rules if AI service is down
            for (Map<String, Object> base : baseResults) {
                if (!base.containsKey("risk")) {
                    long daysInactive = (long) base.get("lastActive");
                    base.put("risk", daysInactive > 60 ? "CRITICAL" : (daysInactive > 30 ? "HIGH" : "HEALTHY"));
                    base.put("score", daysInactive > 60 ? 85 : 5);
                }
            }
        }
        
        return ResponseEntity.ok(baseResults);
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
    public ResponseEntity<Map<String, Object>> getNeglectOpportunities() {
        Map<String, Long> skillCount = new HashMap<>();
        for (FreelancerProfile p : profileRepository.findAll()) {
            if (p.getSkills() != null) {
                for (String skill : p.getSkills()) {
                    skillCount.merge(normalizeSkill(skill), 1L, Long::sum);
                }
            }
        }
        
        long total = Math.max(1, userRepository.countByRole(Role.ROLE_FREELANCER));
        List<Map<String, Object>> platformSkills = skillCount.entrySet().stream()
            .sorted(Map.Entry.<String,Long>comparingByValue().reversed()).limit(10)
            .map(e -> {
                int demand = (int) Math.min(99, (e.getValue()*100)/total);
                Map<String,Object> m = new LinkedHashMap<>();
                m.put("domain", e.getKey()); m.put("demand", demand);
                m.put("count", e.getValue()); m.put("predicted6m", Math.min(99, demand+(demand>50?4:8)));
                return m;
            }).collect(Collectors.toList());

        Map<String, Object> aiReq = Map.of("platform_skill_supply", skillCount);
        int score = 25;
        String risk = "LOW";
        String summary = null;
        String githubTrendingSkill = "Python";
        List<String> topSeoSkills = List.of("AI Integration", "Next.js", "Python");
        List<String> skillGaps = new ArrayList<>();

        try {
            org.springframework.web.client.RestTemplate rt = new org.springframework.web.client.RestTemplate();
            Map<String, Object> aiResp = rt.postForObject("http://localhost:8001/predict-opportunity-neglect", aiReq, Map.class);
            if (aiResp != null) {
                if (aiResp.containsKey("score")) score = ((Number) aiResp.get("score")).intValue();
                if (aiResp.containsKey("risk")) risk = (String) aiResp.get("risk");
                if (aiResp.containsKey("summary")) summary = (String) aiResp.get("summary");
                if (aiResp.containsKey("raw_data")) {
                    Map<String, Object> raw = (Map<String, Object>) aiResp.get("raw_data");
                    if (raw.containsKey("github_trending_skill")) githubTrendingSkill = (String) raw.get("github_trending_skill");
                    if (raw.containsKey("top_seo_trending_skills")) topSeoSkills = (List<String>) raw.get("top_seo_trending_skills");
                    if (raw.containsKey("detected_skill_gaps")) skillGaps = (List<String>) raw.get("detected_skill_gaps");
                }
            }
        } catch (Exception ignored) {}

        if (summary == null) {
            summary = "ProLance AI Opportunity Neglect Agent compares real-time platform skill supply against global SEO search volumes and GitHub trending repositories to identify critical capability gaps.";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("opportunityNeglectScore", score);
        response.put("riskLevel", risk);
        response.put("severity", risk);
        response.put("summary", summary);
        response.put("githubTrendingSkill", githubTrendingSkill);
        response.put("topSeoSkills", topSeoSkills);
        response.put("skillGaps", skillGaps);
        response.put("platformSkills", platformSkills);

        return ResponseEntity.ok(response);
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

    // ── Comprehensive Product Neglect Analysis Endpoint ──
    @GetMapping("/neglect/product")
    public ResponseEntity<Map<String, Object>> getNeglectProduct() {
        long fl = Math.max(1, userRepository.countByRole(Role.ROLE_FREELANCER));
        long cl = Math.max(1, userRepository.countByRole(Role.ROLE_CLIENT));
        long all = fl + cl;
        long totalProjects = Math.max(1, projectRepository.count());

        // Pillar 1: Feature Adoption Analysis
        List<Map<String, Object>> features = new ArrayList<>();
        int bidAdoption = pct(applicationRepository.count(), fl);
        int projectAdoption = pct(projectRepository.count(), cl);
        int reviewAdoption = pct(reviewRepository.count(), all);
        int teamAdoption = pct(teamRepository.count(), fl);
        int chatAdoption = pct(featureUsageLogRepository.countByFeatureKey("ai_chat"), all);
        int intelAdoption = pct(featureUsageLogRepository.countByFeatureKey("market_intel"), all);
        int milestoneAdoption = pct(milestoneRepository.count(), totalProjects);

        features.add(featureEntry("Bid System", bidAdoption));
        features.add(featureEntry("Projects", projectAdoption));
        features.add(featureEntry("Two-Way Reviews", reviewAdoption));
        features.add(featureEntry("Team Formation", teamAdoption));
        features.add(featureEntry("AI Chat Assistant", chatAdoption));
        features.add(featureEntry("Market Intelligence", intelAdoption));
        features.add(featureEntry("Milestones / Workspaces", milestoneAdoption));

        double avgFeatureAdoption = features.stream()
                .mapToInt(f -> (int) f.get("adoption"))
                .average().orElse(0.0);
        double featureDeficitPct = Math.max(0.0, 100.0 - avgFeatureAdoption);

        // Pillar 2: Freelancer Incomplete Profile Analysis
        List<FreelancerProfile> allProfiles = profileRepository.findAll();
        List<Map<String, Object>> incompleteProfilesList = new ArrayList<>();
        int completeProfilesCount = 0;

        for (FreelancerProfile profile : allProfiles) {
            User u = profile.getUser();
            int completeness = 0;
            List<String> missingFields = new ArrayList<>();

            // 1. Headline (15 pts)
            if (profile.getHeadline() != null && !profile.getHeadline().trim().isEmpty()) {
                completeness += 15;
            } else {
                missingFields.add("Missing Headline");
            }

            // 2. Bio (25 pts)
            if (profile.getBio() != null && profile.getBio().trim().length() >= 100) {
                completeness += 25;
            } else if (profile.getBio() != null && !profile.getBio().trim().isEmpty()) {
                completeness += 10;
                missingFields.add("Short Bio (<100 chars)");
            } else {
                missingFields.add("Missing Bio");
            }

            // 3. Hourly rate (20 pts)
            if (profile.getHourlyRate() != null && profile.getHourlyRate().doubleValue() > 0) {
                completeness += 20;
            } else {
                missingFields.add("Missing Hourly Rate");
            }

            // 4. Skills (20 pts)
            if (profile.getSkills() != null && profile.getSkills().size() >= 2) {
                completeness += 20;
            } else if (profile.getSkills() != null && profile.getSkills().size() == 1) {
                completeness += 10;
                missingFields.add("Insufficient Skills (<2)");
            } else {
                missingFields.add("Missing Skills");
            }

            // 5. Photo / Avatar (10 pts)
            if (u != null && u.getProfileImageUrl() != null && !u.getProfileImageUrl().trim().isEmpty()) {
                completeness += 10;
            } else {
                missingFields.add("Missing Photo/Avatar");
            }

            // 6. Availability (10 pts)
            if (profile.getAvailability() != null && !profile.getAvailability().trim().isEmpty()) {
                completeness += 10;
            } else {
                missingFields.add("Unset Availability");
            }

            if (completeness >= 80) {
                completeProfilesCount++;
            } else {
                Map<String, Object> inc = new LinkedHashMap<>();
                inc.put("id", u != null ? u.getId().toString() : profile.getId().toString());
                inc.put("name", u != null ? u.getFullName() : "Freelancer #" + profile.getId());
                inc.put("email", u != null ? u.getEmail() : "");
                inc.put("avatar", u != null ? u.getProfileImageUrl() : null);
                inc.put("headline", profile.getHeadline() != null ? profile.getHeadline() : "Freelancer");
                inc.put("completeness", completeness);
                inc.put("missingFields", missingFields);
                incompleteProfilesList.add(inc);
            }
        }

        int totalProfilesCount = Math.max(1, allProfiles.size());
        int incompleteProfilesCount = incompleteProfilesList.size();
        double incompleteProfilePct = Math.round((incompleteProfilesCount * 100.0) / totalProfilesCount);

        // Pillar 3: Lack of Transparency Analysis
        long missingGithubCount = allProfiles.stream()
                .filter(p -> p.getGithubUrl() == null || p.getGithubUrl().trim().isEmpty()).count();
        long missingLinkedinCount = allProfiles.stream()
                .filter(p -> p.getLinkedinUrl() == null || p.getLinkedinUrl().trim().isEmpty()).count();
        long missingPortfolioCount = allProfiles.stream()
                .filter(p -> p.getPortfolioUrl() == null || p.getPortfolioUrl().trim().isEmpty()).count();
        long missingAllProofCount = allProfiles.stream()
                .filter(p -> (p.getGithubUrl() == null || p.getGithubUrl().trim().isEmpty())
                          && (p.getLinkedinUrl() == null || p.getLinkedinUrl().trim().isEmpty())
                          && (p.getPortfolioUrl() == null || p.getPortfolioUrl().trim().isEmpty())).count();

        double missingProofPct = (missingAllProofCount * 100.0) / totalProfilesCount;

        // Deliverables transparency: milestones with PR or submission note
        List<Milestone> allMilestones = milestoneRepository.findAll();
        long unverifiedMilestones = allMilestones.stream()
                .filter(m -> (m.getSubmissionNote() == null || m.getSubmissionNote().trim().isEmpty())
                          && (m.getGithubPrUrl() == null || m.getGithubPrUrl().trim().isEmpty())).count();
        double unverifiedDeliverablesPct = allMilestones.isEmpty() ? 25.0 :
                (unverifiedMilestones * 100.0) / allMilestones.size();

        // Project transparency: completed projects without reviews
        long completedProjects = projectRepository.countByStatus(Project.Status.COMPLETED);
        long reviewsCount = reviewRepository.count();
        double unreviewedProjectsPct = completedProjects == 0 ? 0.0 :
                Math.max(0.0, ((completedProjects - reviewsCount) * 100.0) / completedProjects);

        double transparencyDeficitPct = Math.round((missingProofPct * 0.45) + (unverifiedDeliverablesPct * 0.35) + (unreviewedProjectsPct * 0.20));

        // Composite Unified Product Neglect Score (0 - 100)
        double rawProductNeglectScore = (0.40 * featureDeficitPct) +
                                        (0.35 * incompleteProfilePct) +
                                        (0.25 * transparencyDeficitPct);
        int productNeglectScore = (int) Math.min(100, Math.max(0, Math.round(rawProductNeglectScore)));

        String riskLevel = productNeglectScore >= 65 ? "CRITICAL" :
                           productNeglectScore >= 45 ? "HIGH" :
                           productNeglectScore >= 25 ? "MEDIUM" : "HEALTHY";

        // Query AI Service for dynamic LLM diagnosis
        String summary = null;
        try {
            org.springframework.web.client.RestTemplate rt = new org.springframework.web.client.RestTemplate();
            Map<String, Object> aiReq = Map.of(
                "feature_key", "team_formation",
                "avg_feature_adoption_pct", avgFeatureAdoption,
                "incomplete_profile_pct", incompleteProfilePct,
                "transparency_deficit_pct", transparencyDeficitPct,
                "complaints", 1,
                "reviews", List.of("Some profiles miss portfolio links", "Feature guide needed")
            );
            Map<String, Object> aiResp = rt.postForObject("http://localhost:8001/predict-product-neglect", aiReq, Map.class);
            if (aiResp != null && aiResp.containsKey("summary")) {
                summary = (String) aiResp.get("summary");
            }
        } catch (Exception ignored) {}

        if (summary == null) {
            summary = String.format("Product Neglect Risk is %s (%d/100). Feature adoption is at %.0f%% (deficit: %.0f%%), %d of %d (%.0f%%) freelancer profiles remain incomplete, and lack of transparency index is %.0f%%. Recommended: trigger automated profile nudges and interactive feature tours.",
                    riskLevel, productNeglectScore, avgFeatureAdoption, featureDeficitPct, incompleteProfilesCount, totalProfilesCount, incompleteProfilePct, transparencyDeficitPct);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("productNeglectScore", productNeglectScore);
        response.put("riskLevel", riskLevel);
        response.put("severity", riskLevel);
        response.put("summary", summary);
        response.put("features", features);
        response.put("incompleteProfiles", incompleteProfilesList);

        Map<String, Object> pillarBreakdown = new LinkedHashMap<>();
        pillarBreakdown.put("featureAdoption", Map.of(
            "score", (int) Math.round(avgFeatureAdoption),
            "deficit", (int) Math.round(featureDeficitPct),
            "weight", "40%",
            "status", avgFeatureAdoption < 40 ? "ATTENTION" : "GOOD"
        ));
        pillarBreakdown.put("incompleteProfiles", Map.of(
            "incompleteCount", incompleteProfilesCount,
            "totalCount", totalProfilesCount,
            "incompleteRate", (int) Math.round(incompleteProfilePct),
            "weight", "35%",
            "status", incompleteProfilePct > 40 ? "ATTENTION" : "GOOD"
        ));
        pillarBreakdown.put("transparency", Map.of(
            "deficit", (int) Math.round(transparencyDeficitPct),
            "missingProofPct", (int) Math.round(missingProofPct),
            "unverifiedDeliverablesPct", (int) Math.round(unverifiedDeliverablesPct),
            "weight", "25%",
            "status", transparencyDeficitPct > 40 ? "ATTENTION" : "GOOD"
        ));
        response.put("pillarBreakdown", pillarBreakdown);

        Map<String, Object> transparencyMetrics = new LinkedHashMap<>();
        transparencyMetrics.put("missingProofPct", Math.round(missingProofPct));
        transparencyMetrics.put("missingGithubCount", missingGithubCount);
        transparencyMetrics.put("missingLinkedinCount", missingLinkedinCount);
        transparencyMetrics.put("missingPortfolioCount", missingPortfolioCount);
        transparencyMetrics.put("unverifiedDeliverablesPct", Math.round(unverifiedDeliverablesPct));
        transparencyMetrics.put("unreviewedProjectsPct", Math.round(unreviewedProjectsPct));
        response.put("transparencyMetrics", transparencyMetrics);

        return ResponseEntity.ok(response);
    }

    // ── Comprehensive Financial Neglect Analysis Endpoint ──
    @GetMapping("/neglect/financial")
    public ResponseEntity<Map<String, Object>> getNeglectFinancial() {
        // 1. Revenue trend analysis
        List<RevenueSnapshot> snaps = revenueSnapshotRepository.findAllByOrderByMonthDesc();
        double currentMonthRevenue = snaps.size() > 0 ? snaps.get(0).getTotalRevenue().doubleValue() : 5000.0;
        double previousMonthRevenue = snaps.size() > 1 ? snaps.get(1).getTotalRevenue().doubleValue() : 6200.0;
        double dropPercentage = previousMonthRevenue > 0
                ? Math.max(0.0, ((previousMonthRevenue - currentMonthRevenue) / previousMonthRevenue) * 100.0)
                : 0.0;

        // 2. Overdue milestones analysis
        Instant now = Instant.now();
        List<Milestone> allMilestones = milestoneRepository.findAll();
        List<Map<String, Object>> overdueMilestonesList = new ArrayList<>();
        double overdueAmount = 0.0;

        for (Milestone m : allMilestones) {
            if (m.getDueDate() != null && m.getDueDate().isBefore(now) && m.getStatus() != Milestone.Status.DONE) {
                long daysOverdue = ChronoUnit.DAYS.between(m.getDueDate(), now);
                overdueAmount += m.getAmount() != null ? m.getAmount().doubleValue() : 0.0;

                Map<String, Object> om = new LinkedHashMap<>();
                om.put("id", m.getId());
                om.put("title", m.getTitle());
                om.put("projectName", m.getProject() != null ? m.getProject().getTitle() : "Project #" + m.getId());
                om.put("amount", m.getAmount() != null ? m.getAmount().doubleValue() : 0.0);
                om.put("daysOverdue", daysOverdue);
                om.put("status", m.getStatus().name());
                om.put("assignedFreelancer", m.getAssignedFreelancerName() != null ? m.getAssignedFreelancerName() : "Unassigned");
                overdueMilestonesList.add(om);
            }
        }

        // 3. Payment delays analysis
        List<Payment> allPayments = paymentRepository.findAll();
        List<Payment> pendingPayments = allPayments.stream()
                .filter(p -> p.getStatus() == Payment.Status.PENDING)
                .collect(Collectors.toList());

        double delayedPaymentAmount = 0.0;
        long totalDelayDays = 0;
        int delayedPaymentsCount = 0;

        for (Payment p : pendingPayments) {
            long daysPending = p.getCreatedAt() != null ? ChronoUnit.DAYS.between(p.getCreatedAt(), now) : 0;
            if (daysPending >= 3) {
                delayedPaymentsCount++;
                delayedPaymentAmount += p.getAmount() != null ? p.getAmount().doubleValue() : 0.0;
                totalDelayDays += daysPending;
            }
        }
        double avgPaymentDelay = delayedPaymentsCount > 0 ? (double) totalDelayDays / delayedPaymentsCount : 2.5;

        // 4. Client and Freelancer reviews
        List<Review> recentReviews = reviewRepository.findTop20ByOrderByCreatedAtDesc();
        double avgRating = recentReviews.stream().mapToInt(Review::getRating).average().orElse(4.6);

        // 5. ML Random Forest prediction from Python AI service
        int rfPrediction = 0;
        double rfConfidence = 75.0;
        double mlScore = 20.0;
        String riskLevel = "HEALTHY";
        String summary = null;

        try {
            org.springframework.web.client.RestTemplate rt = new org.springframework.web.client.RestTemplate();
            Map<String, Object> mlReq = Map.of(
                "budget", currentMonthRevenue > 0 ? currentMonthRevenue : 5000.0,
                "agreed_amount", currentMonthRevenue * 0.92,
                "payment_delay", avgPaymentDelay,
                "overdue_milestones", overdueMilestonesList.size(),
                "client_rating", avgRating,
                "freelancer_rating", Math.min(avgRating + 0.3, 5.0),
                "revenue_drop", dropPercentage
            );
            Map<String, Object> mlResp = rt.postForObject("http://localhost:8001/predict-financial-neglect", mlReq, Map.class);
            if (mlResp != null) {
                if (mlResp.containsKey("rf_prediction")) rfPrediction = (int) mlResp.get("rf_prediction");
                if (mlResp.containsKey("rf_confidence")) rfConfidence = ((Number) mlResp.get("rf_confidence")).doubleValue();
                if (mlResp.containsKey("score")) mlScore = ((Number) mlResp.get("score")).doubleValue();
                if (mlResp.containsKey("risk")) riskLevel = (String) mlResp.get("risk");
                if (mlResp.containsKey("summary")) summary = (String) mlResp.get("summary");
            }
        } catch (Exception ignored) {}

        // Unified Financial Neglect Score calculation
        double financialScoreCalc = (mlScore * 0.50) + (Math.min(100, dropPercentage * 2.0) * 0.30) + (Math.min(100, overdueMilestonesList.size() * 15.0) * 0.20);
        int financialNeglectScore = (int) Math.min(100, Math.max(0, Math.round(financialScoreCalc)));

        if (financialNeglectScore >= 65) riskLevel = "CRITICAL";
        else if (financialNeglectScore >= 45) riskLevel = "HIGH";
        else if (financialNeglectScore >= 25) riskLevel = "MEDIUM";
        else riskLevel = "HEALTHY";

        if (summary == null) {
            summary = String.format("Financial Neglect Risk is %s (%d/100). MoM revenue drop is %.1f%% ($%.0f vs $%.0f), %d milestone(s) totaling $%.0f are overdue, and %d payment(s) are experiencing delays (avg %.1f days). Random Forest ML confidence is %.1f%%.",
                    riskLevel, financialNeglectScore, dropPercentage, currentMonthRevenue, previousMonthRevenue, overdueMilestonesList.size(), overdueAmount, delayedPaymentsCount, avgPaymentDelay, rfConfidence);
        }

        // 6. 12-month revenue curve + 3-month ML forecast
        List<RevenueSnapshot> orderedSnaps = new ArrayList<>(snaps);
        Collections.reverse(orderedSnaps);
        List<Map<String, Object>> revenueChart = new ArrayList<>();
        for (RevenueSnapshot s : orderedSnaps) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("month", s.getMonth());
            p.put("actual", s.getTotalRevenue().doubleValue());
            revenueChart.add(p);
        }
        double lastRev = snaps.size() > 0 ? snaps.get(0).getTotalRevenue().doubleValue() : 5000.0;
        double prevRev = snaps.size() > 1 ? snaps.get(1).getTotalRevenue().doubleValue() : 5500.0;
        double growth = Math.max(-0.25, Math.min(prevRev > 0 ? (lastRev - prevRev) / prevRev : 0.03, 0.25));
        double projected = lastRev;
        for (String m : new String[]{"Next Month", "+2 Months", "+3 Months"}) {
            projected = projected * (1 + growth);
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("month", m);
            p.put("predicted", Math.round(projected * 100.0) / 100.0);
            revenueChart.add(p);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("financialNeglectScore", financialNeglectScore);
        response.put("riskLevel", riskLevel);
        response.put("severity", riskLevel);
        response.put("summary", summary);
        response.put("currentMonthRevenue", currentMonthRevenue);
        response.put("previousMonthRevenue", previousMonthRevenue);
        response.put("revenueDropPct", Math.round(dropPercentage * 10.0) / 10.0);
        response.put("delayedPaymentsCount", delayedPaymentsCount);
        response.put("delayedPaymentAmount", delayedPaymentAmount);
        response.put("avgPaymentDelayDays", Math.round(avgPaymentDelay * 10.0) / 10.0);
        response.put("overdueMilestonesCount", overdueMilestonesList.size());
        response.put("overdueMilestonesAmount", overdueAmount);
        response.put("overdueMilestones", overdueMilestonesList);
        response.put("rfPrediction", rfPrediction);
        response.put("rfConfidence", rfConfidence);
        response.put("revenueChart", revenueChart);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/neglect/opportunity")
    public ResponseEntity<?> getNeglectOpportunityAlias() {
        return getNeglectOpportunities();
    }
}

