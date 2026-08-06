package com.trigrowth.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trigrowth.model.AgentResult;
import com.trigrowth.model.BusinessEvent;
import com.trigrowth.model.Recommendation;
import com.trigrowth.repository.AgentResultRepository;
import com.trigrowth.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RecommendationService {

    private final AgentResultRepository    agentResultRepository;
    private final RecommendationRepository recommendationRepository;
    private final AutomationService        automationService;
    private final SimpMessagingTemplate    messagingTemplate;
    private final ObjectMapper             objectMapper;

    /**
     * Persists the AI service response (agent results + recommendation).
     * Called by EventCollectorService after every /analyze/event call.
     */
    public void persistAiResponse(BusinessEvent event, Map<String, Object> aiResponse) {
        try {
            // ── 1. Parse agent results ────────────────────────────────
            List<Map<String, Object>> agentResults =
                    objectMapper.convertValue(aiResponse.get("agent_results"),
                            new TypeReference<>() {});

            AgentResult topAgentResult = null;
            double      topScore       = -1;

            for (Map<String, Object> ar : agentResults) {
                AgentResult entity = AgentResult.builder()
                        .businessEvent(event)
                        .agentName((String) ar.get("agent_name"))
                        .severity((String) ar.get("severity"))
                        .score(((Number) ar.getOrDefault("score", 0)).doubleValue())
                        .summary((String) ar.getOrDefault("summary", ""))
                        .rawDataJson(objectMapper.writeValueAsString(ar.getOrDefault("raw_data", Map.of())))
                        .createdAt(Instant.now())
                        .build();

                agentResultRepository.save(entity);

                double score = entity.getScore();
                if (score > topScore) { topScore = score; topAgentResult = entity; }
            }

            // ── 2. Parse recommendation (may be null) ─────────────────
            Map<String, Object> recMap = objectMapper.convertValue(
                    aiResponse.get("recommendation"), new TypeReference<>() {});

            Map<String, Object> decisionMap = objectMapper.convertValue(
                    aiResponse.get("decision"), new TypeReference<>() {});

            boolean shouldRecommend = decisionMap != null
                    && Boolean.TRUE.equals(decisionMap.get("should_recommend"));

            if (shouldRecommend && recMap != null && topAgentResult != null) {
                // Priority: 1-4 mapped from severity
                int priority = switch (topAgentResult.getSeverity()) {
                    case "CRITICAL" -> 1;
                    case "HIGH"     -> 2;
                    case "MEDIUM"   -> 3;
                    default          -> 4;
                };

                String automationPlanJson = objectMapper.writeValueAsString(
                        recMap.getOrDefault("automation_plan", List.of()));

                Recommendation rec = Recommendation.builder()
                        .agentResult(topAgentResult)
                        .priority(priority)
                        .status("PENDING")
                        .problem((String) recMap.getOrDefault("problem", ""))
                        .reason((String) recMap.getOrDefault("reason", ""))
                        .prediction((String) recMap.getOrDefault("prediction", ""))
                        .recommendedAction((String) recMap.getOrDefault("recommended_action", ""))
                        .expectedImprovement((String) recMap.getOrDefault("expected_improvement", ""))
                        .confidence(((Number) recMap.getOrDefault("confidence", 50)).doubleValue())
                        .automationPlanJson(automationPlanJson)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();

                recommendationRepository.save(rec);

                // Broadcast to owner dashboard via WebSocket
                messagingTemplate.convertAndSend("/topic/recommendations", Map.of(
                        "type", "NEW_RECOMMENDATION",
                        "priority", priority,
                        "agent", topAgentResult.getAgentName(),
                        "severity", topAgentResult.getSeverity(),
                        "problem", rec.getProblem()
                ));

                log.info("Recommendation saved: agent={} severity={} priority={}",
                        topAgentResult.getAgentName(), topAgentResult.getSeverity(), priority);
            }

        } catch (Exception e) {
            log.error("Failed to persist AI response for event {}: {}", event.getId(), e.getMessage(), e);
        }
    }

    // ── Query methods ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Recommendation> getPendingRecommendations() {
        return recommendationRepository.findByStatus("PENDING");
    }

    @Transactional(readOnly = true)
    public List<Recommendation> getAllRecommendations() {
        return recommendationRepository.findAllByOrderByPriorityAscCreatedAtDesc();
    }

    public Recommendation approveRecommendation(Long id) {
        Recommendation rec = findOrThrow(id);
        rec.setStatus("APPROVED");
        rec.setUpdatedAt(Instant.now());
        recommendationRepository.save(rec);
        automationService.execute(rec);
        return rec;
    }

    public Recommendation rejectRecommendation(Long id) {
        Recommendation rec = findOrThrow(id);
        rec.setStatus("REJECTED");
        rec.setUpdatedAt(Instant.now());
        return recommendationRepository.save(rec);
    }

    private Recommendation findOrThrow(Long id) {
        return recommendationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found: " + id));
    }
}
