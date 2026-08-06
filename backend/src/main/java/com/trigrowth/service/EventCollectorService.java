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
    @Scheduled(fixedDelay = 60000)
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
     * Handles Customer Neglect and Product Neglect.
     */
    @Scheduled(fixedDelay = 360000)
    public void simulateSixHourly() {
        log.info("--- Running 6-Hour Simulation ---");
        // Customer Neglect
        Map<String, Object> customerPayload = new HashMap<>();
        long inactiveClientsCount = userRepository.countByRoleAndUpdatedAtBefore(
                Role.ROLE_CLIENT, Instant.now().minus(30, ChronoUnit.DAYS));
        customerPayload.put("inactive_clients_count", inactiveClientsCount);
        customerPayload.put("days_inactive", 60);
        customerPayload.put("active_projects", projectRepository.count());
        emit("CLIENT_INACTIVITY_REPORT", "SYSTEM", 0L, customerPayload);

        // Product Neglect
        Map<String, Object> productPayload = new HashMap<>();
        long teamCount = teamRepository.count();
        long totalFreelancers = userRepository.countByRole(Role.ROLE_FREELANCER);
        double adoptionRate = totalFreelancers == 0 ? 0 : (double) teamCount / totalFreelancers;
        List<Review> recentReviews = reviewRepository.findTop20ByOrderByCreatedAtDesc();
        List<String> reviewComments = recentReviews.stream()
                .map(Review::getComment)
                .collect(Collectors.toList());
        productPayload.put("feature_key", "team_formation");
        productPayload.put("feature_usage_count", teamCount);
        productPayload.put("total_freelancers", totalFreelancers);
        productPayload.put("adoption_rate", adoptionRate);
        productPayload.put("recent_reviews", reviewComments);
        emit("FEATURE_USAGE_REPORT", "SYSTEM", 0L, productPayload);
    }

    /**
     * Daily Equivalent (Simulated as every 1440 seconds / 24 mins)
     * Handles Financial Neglect.
     */
    @Scheduled(fixedDelay = 1440000)
    public void simulateDaily() {
        log.info("--- Running Daily Simulation ---");
        Map<String, Object> financialPayload = new HashMap<>();
        List<RevenueSnapshot> snaps = revenueSnapshotRepository.findAllByOrderByMonthDesc();
        double currentMonthRevenue = 0.0;
        double previousMonthRevenue = 0.0;
        double dropPercentage = 0.0;
        double churnRate = 0.05; // Mock churn rate for ML model
        int activeSubscriptions = 100; // Mock active subscriptions

        if (snaps.size() >= 2) {
            currentMonthRevenue = snaps.get(0).getTotalRevenue().doubleValue();
            previousMonthRevenue = snaps.get(1).getTotalRevenue().doubleValue();
            if (previousMonthRevenue > 0) {
                dropPercentage = ((previousMonthRevenue - currentMonthRevenue) / previousMonthRevenue) * 100;
            }
        }
        
        financialPayload.put("current_month_revenue", currentMonthRevenue);
        financialPayload.put("previous_month_revenue", previousMonthRevenue);
        financialPayload.put("drop_percentage", dropPercentage);
        financialPayload.put("churn_rate", churnRate);
        financialPayload.put("active_subscriptions", activeSubscriptions);
        emit("REVENUE_REPORT", "SYSTEM", 0L, financialPayload);
    }
}
