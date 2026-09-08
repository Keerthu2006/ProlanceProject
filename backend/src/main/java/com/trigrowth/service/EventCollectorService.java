package com.trigrowth.service;

import com.trigrowth.model.BusinessEvent;
import com.trigrowth.model.Review;
import com.trigrowth.model.RevenueSnapshot;
import com.trigrowth.model.FreelancerProfile;
import com.trigrowth.model.Role;
import com.trigrowth.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EventCollectorService {

    private final BusinessEventRepository businessEventRepository;
    private final RecommendationService recommendationService;
    private final RestTemplate restTemplate;

    // Added repositories for dynamic data extraction
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RevenueSnapshotRepository revenueSnapshotRepository;
    private final ReviewRepository reviewRepository;
    private final FreelancerProfileRepository profileRepository;
    private final ProjectRepository projectRepository;
    private final ApplicationRepository applicationRepository;

    @Value("${app.ai-service.base-url:http://127.0.0.1:8001}")
    private String aiServiceUrl;

    public void emit(String eventType, String entityType, Long entityId, Map<String, Object> payload) {
        try {
            String payloadJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            BusinessEvent event = BusinessEvent.builder()
                    .eventType(eventType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .payloadJson(payloadJson)
                    .processed(false)
                    .createdAt(Instant.now())
                    .build();

            event = businessEventRepository.save(event);
            log.info("Business Event saved: type={} id={}", eventType, event.getId());

            // 1. Call Python AI Service
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("event_id", event.getId().toString());
            requestBody.put("event_type", event.getEventType());
            requestBody.put("entity_type", event.getEntityType());
            requestBody.put("entity_id", event.getEntityId() != null ? event.getEntityId().toString() : "null");
            requestBody.put("timestamp", event.getCreatedAt().toString());
            requestBody.put("payload", payload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            String url = aiServiceUrl + "/analyze/event";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            // 2. Persist Response
            if (response.getBody() != null) {
                recommendationService.persistAiResponse(event, response.getBody());
            }

            event.setProcessed(true);
            businessEventRepository.save(event);

        } catch (Exception e) {
            log.error("Error emitting event or calling AI service", e);
        }
    }

    /**
     * Hourly Equivalent (Simulated as every 60 seconds)
     * Handles Opportunity / Market Trend Simulation.
     */
    @Scheduled(initialDelay = 20000, fixedDelay = 60000)
    public void simulateHourly() {
        log.info("--- Running Hourly Simulation ---");
        Map<String, Object> opportunityPayload = new HashMap<>();
        List<FreelancerProfile> profiles = profileRepository.findAll();
        Map<String, Integer> skillSupply = new HashMap<>();
        for (FreelancerProfile profile : profiles) {
            for (String skill : profile.getSkills()) {
                skillSupply.put(skill, skillSupply.getOrDefault(skill, 0) + 1);
            }
        }
        opportunityPayload.put("platform_skill_supply", skillSupply);
        emit("MARKET_TREND_REPORT", "SYSTEM", 0L, opportunityPayload);
    }

    /**
     * 6-Hour Equivalent (Simulated as every 360 seconds)
     * Real per-client Customer Neglect scan + Product Neglect report.
     */
    @Scheduled(initialDelay = 20000, fixedDelay = 360000)
    public void simulateSixHourly() throws Exception {
        log.info("--- Running 6-Hour Simulation (Real Neglect Scan) ---");

        Instant now = Instant.now();
        Instant thirtyDaysAgo  = now.minus(30, ChronoUnit.DAYS);
        Instant fourteenDaysAgo = now.minus(14, ChronoUnit.DAYS);

        // ── Customer Neglect: scan every real client ──────────────────
        List<com.trigrowth.model.User> clients =
                userRepository.findAllByRole(com.trigrowth.model.Role.ROLE_CLIENT);

        // Build at-risk client list
        List<Map<String, Object>> atRiskClients = new java.util.ArrayList<>();
        int criticalCount = 0, highCount = 0;

        for (com.trigrowth.model.User client : clients) {
            java.time.Instant lastActivity = client.getLastLoginAt() != null
                    ? client.getLastLoginAt()
                    : client.getCreatedAt();
            long daysInactive = lastActivity != null
                    ? ChronoUnit.DAYS.between(lastActivity, now)
                    : 999L;

            long projects30d = projectRepository.countByClient_IdAndCreatedAtAfter(
                    client.getId(), thirtyDaysAgo);

            // Only include clients who show neglect signals
            String risk = null;
            if      (daysInactive > 60)                          { risk = "CRITICAL"; criticalCount++; }
            else if (daysInactive > 30)                          { risk = "HIGH";     highCount++; }
            else if (daysInactive > 14 && projects30d == 0)      { risk = "MEDIUM"; }
            else if (daysInactive > 7  && projects30d == 0)      { risk = "LOW"; }

            if (risk != null) {
                Map<String, Object> clientInfo = new HashMap<>();
                clientInfo.put("client_id",    client.getId().toString());
                clientInfo.put("client_name",  client.getFullName());
                clientInfo.put("email",        client.getEmail());
                clientInfo.put("days_inactive", daysInactive);
                clientInfo.put("projects_30d", projects30d);
                clientInfo.put("risk",         risk);
                atRiskClients.add(clientInfo);
            }
        }

        Map<String, Object> customerPayload = new HashMap<>();
        customerPayload.put("inactive_clients_count", atRiskClients.size());
        customerPayload.put("critical_count",   criticalCount);
        customerPayload.put("high_count",       highCount);
        customerPayload.put("days_inactive",    criticalCount > 0 ? 61 : (highCount > 0 ? 31 : 15));
        customerPayload.put("total_clients",    clients.size());


        // --- FREELANCER GHOSTING ---
        List<Map<String, Object>> ghostingFreelancers = userRepository.findFreelancersIgnoringClients(1); // unread for >= 1 day
        if (!ghostingFreelancers.isEmpty()) {
            Map<String, Object> freelancerPayload = new HashMap<>();
            freelancerPayload.put("ghosting_count", ghostingFreelancers.size());
            freelancerPayload.put("freelancers", ghostingFreelancers);
            
            emit("FREELANCER_GHOSTING_REPORT", "SYSTEM", 0L, freelancerPayload);
        }

        customerPayload.put("at_risk_clients",  atRiskClients);
        // Top risk client for LLM summary
        if (!atRiskClients.isEmpty()) {
            Map<String, Object> top = atRiskClients.get(0);
            customerPayload.put("worst_client_name",     top.get("client_name"));
            customerPayload.put("worst_client_days",     top.get("days_inactive"));
            customerPayload.put("worst_client_risk",     top.get("risk"));
        }
        emit("CLIENT_INACTIVITY_REPORT", "SYSTEM", 0L, customerPayload);
        log.info("Customer Neglect scan: {} at-risk clients ({} CRITICAL, {} HIGH)",
                atRiskClients.size(), criticalCount, highCount);

        // ── Product Neglect: feature adoption ────────────────────────
        Map<String, Object> productPayload = new HashMap<>();
        long teamCount          = teamRepository.count();
        long totalFreelancers   = userRepository.countByRole(com.trigrowth.model.Role.ROLE_FREELANCER);
        double teamAdoption     = totalFreelancers == 0 ? 0 : (double) teamCount / totalFreelancers;
        long bidCount           = applicationRepository.count();
        double bidAdoption      = totalFreelancers == 0 ? 0 : (double) bidCount / totalFreelancers;
        List<Review> recentReviews = reviewRepository.findTop20ByOrderByCreatedAtDesc();
        List<String> reviewComments = recentReviews.stream()
                .map(Review::getComment).filter(c -> c != null && !c.isBlank())
                .collect(Collectors.toList());
        productPayload.put("feature_key",           "team_formation");
        productPayload.put("feature_usage_count",   teamCount);
        productPayload.put("total_freelancers",      totalFreelancers);
        productPayload.put("adoption_rate",          teamAdoption);
        productPayload.put("bid_adoption_rate",      bidAdoption);
        productPayload.put("recent_reviews",         reviewComments);
        emit("FEATURE_USAGE_REPORT", "SYSTEM", 0L, productPayload);
    }

    /**
     * Daily Equivalent (Simulated as every 1440 seconds / 24 mins)
     * Handles Financial Neglect.
     */
    @Scheduled(initialDelay = 20000, fixedDelay = 1440000)
    public void simulateDaily() {
        log.info("--- Running Daily Simulation ---");

        // ── Financial Neglect: use REAL payment/project data from DB ──────
        // Pull from RevenueSnapshots for trend analysis
        List<RevenueSnapshot> snaps = revenueSnapshotRepository.findAllByOrderByMonthDesc();
        double currentMonthRevenue  = snaps.size() > 0 ? snaps.get(0).getTotalRevenue().doubleValue() : 5000.0;
        double previousMonthRevenue = snaps.size() > 1 ? snaps.get(1).getTotalRevenue().doubleValue() : 6500.0;
        double dropPercentage = previousMonthRevenue > 0
            ? ((previousMonthRevenue - currentMonthRevenue) / previousMonthRevenue) * 100
            : 0.0;

        // Count open/completed projects to derive payment delay signal
        long openProjects      = projectRepository.countByStatus(com.trigrowth.model.Project.Status.OPEN);
        long completedProjects = projectRepository.countByStatus(com.trigrowth.model.Project.Status.COMPLETED);
        long cancelledProjects = projectRepository.countByStatus(com.trigrowth.model.Project.Status.CANCELLED);
        long inProgressProjects = projectRepository.countByStatus(com.trigrowth.model.Project.Status.IN_PROGRESS);

        // Estimate payment delay from seeded data: each open project with no activity is a delay signal
        double estimatedPaymentDelay = openProjects > 3 ? openProjects * 2.5 : (inProgressProjects > 1 ? 6.0 : 1.0);
        int estimatedOverdueMs = (int) Math.max(0, openProjects - 2);

        // Average ratings from reviews
        List<Review> recentReviews = reviewRepository.findTop20ByOrderByCreatedAtDesc();
        double avgRating = recentReviews.stream()
            .mapToInt(Review::getRating).average().orElse(4.5);

        Map<String, Object> financialPayload = new HashMap<>();
        // RF model features (must match trained column names exactly)
        financialPayload.put("budget",              currentMonthRevenue > 0 ? currentMonthRevenue : 5000.0);
        financialPayload.put("agreed_amount",       currentMonthRevenue * 0.90);
        financialPayload.put("budget_utilization",  currentMonthRevenue > 0 ? 0.90 : 1.0);
        financialPayload.put("payment_delay_days",  estimatedPaymentDelay);
        financialPayload.put("overdue_milestones",  estimatedOverdueMs);
        financialPayload.put("client_rating",       avgRating);
        financialPayload.put("freelancer_rating",   Math.min(avgRating + 0.3, 5.0));
        // Extra context for the LLM summary
        financialPayload.put("current_month_revenue",  currentMonthRevenue);
        financialPayload.put("previous_month_revenue", previousMonthRevenue);
        financialPayload.put("drop_percentage",        dropPercentage);
        financialPayload.put("open_projects",          openProjects);
        financialPayload.put("completed_projects",     completedProjects);
        financialPayload.put("in_progress_projects",   inProgressProjects);
        emit("REVENUE_REPORT", "SYSTEM", 0L, financialPayload);
        log.info("Financial Neglect scan: revenue drop={}%, delay={}d, overdue={}",
                Math.round(dropPercentage * 10) / 10.0, (int)estimatedPaymentDelay, estimatedOverdueMs);
    }
}
