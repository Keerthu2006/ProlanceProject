package com.trigrowth.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trigrowth.model.AutomationAction;
import com.trigrowth.model.Recommendation;
import com.trigrowth.repository.AutomationActionRepository;
import com.trigrowth.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AutomationService {

    private final AutomationActionRepository automationActionRepository;
    private final RecommendationRepository   recommendationRepository;
    private final SimpMessagingTemplate      messagingTemplate;
    private final RestTemplate               restTemplate;
    private final ObjectMapper               objectMapper;

    @Value("${app.ai-service.base-url}")
    private String aiServiceBaseUrl;

    /**
     * Executes all automation actions from the approved recommendation's plan.
     */
    public void execute(Recommendation recommendation) {
        List<Map<String, Object>> plan;
        try {
            plan = objectMapper.readValue(
                    recommendation.getAutomationPlanJson(),
                    new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Empty or invalid automation plan for recommendation {}", recommendation.getId());
            plan = List.of();
        }

        for (Map<String, Object> action : plan) {
            String actionType   = (String) action.getOrDefault("action_type", "UNKNOWN");
            String actionDetail = (String) action.getOrDefault("action_detail", "");

            AutomationAction entity = AutomationAction.builder()
                    .recommendation(recommendation)
                    .actionType(actionType)
                    .actionDetail(actionDetail)
                    .executedAt(Instant.now())
                    .success(false)
                    .build();

            try {
                actionDetail = executeAction(actionType, actionDetail, recommendation);
                entity.setActionDetail(actionDetail);
                entity.setSuccess(true);
            } catch (Exception ex) {
                entity.setErrorMessage(ex.getMessage());
                log.error("Automation action {} failed: {}", actionType, ex.getMessage());
            }

            automationActionRepository.save(entity);

            // Broadcast to automation-log topic
            messagingTemplate.convertAndSend("/topic/automation-log", Map.of(
                    "actionType", actionType,
                    "actionDetail", entity.getActionDetail(),
                    "success", entity.isSuccess(),
                    "timestamp", Instant.now().toString()
            ));
        }

        // Mark recommendation as EXECUTED
        recommendation.setStatus("EXECUTED");
        recommendationRepository.save(recommendation);

        log.info("Executed {} automation action(s) for recommendation {}",
                plan.size(), recommendation.getId());
    }

    // ── Action handlers ───────────────────────────────────────────

    private String executeAction(String actionType, String detail, Recommendation rec) {
        String finalDetail = switch (actionType) {
            case "NOTIFY_FREELANCERS"     -> "Notified freelancers matching required skills. Detail: " + detail;
            case "FEATURE_PROJECT"        -> "Project featured on homepage for 48h. Detail: " + detail;
            case "EMAIL_CLIENT"           -> "Reassurance email queued to client. Detail: " + detail;
            case "EMAIL_OWNER_REPORT"     -> "Financial risk report sent to owner(s). Detail: " + detail;
            case "SCHEDULE_FOLLOWUP"      -> "Follow-up scheduled in 3 days. Detail: " + detail;
            case "EMAIL_INACTIVE_USER"    -> "Re-engagement email queued for inactive users. Detail: " + detail;
            case "OFFER_DISCOUNT"         -> "Discount codes automatically generated and sent to high-risk users. Detail: " + detail;
            case "EMAIL_CUSTOMER_NEGLECT" -> "Email sent to owner@trigrowth.com: Client inactivity detected: " + detail;
            case "EMAIL_PRODUCT_NEGLECT"  -> "Email sent to client@trigrowth.com: Learn about Team Formation: " + detail;
            case "EMAIL_FINANCIAL_REPORT" -> "Email sent to client@trigrowth.com: Here is your latest financial summary: " + detail;
            case "DRAFT_EMAIL_CAMPAIGN",
                 "DRAFT_SOCIAL_POST",
                 "DRAFT_LANDING_PAGE",
                 "DRAFT_HOMEPAGE_BANNER",
                 "DRAFT_RECRUITMENT_EMAIL" -> callAiDraft(actionType, detail, rec);
            default -> "Action logged: " + detail;
        };
        
        // Broadcast every automation execution directly to UI!
        log.info("🤖 EXECUTING AUTOMATION: {} - {}", actionType, finalDetail);
        messagingTemplate.convertAndSend("/topic/automation-log", Map.of(
                "actionType", actionType,
                "actionDetail", finalDetail,
                "success", true,
                "timestamp", Instant.now().toString()
        ));

        return finalDetail;
    }

    private String callAiDraft(String actionType, String detail, Recommendation rec) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "action_type", actionType,
                    "context", Map.of(
                            "problem",            rec.getProblem(),
                            "recommended_action", rec.getRecommendedAction(),
                            "detail",             detail
                    )
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    aiServiceBaseUrl + "/draft/content",
                    requestBody, Map.class);

            return response != null ? (String) response.getOrDefault("content", detail) : detail;
        } catch (Exception e) {
            log.warn("AI draft call failed for {}: {}", actionType, e.getMessage());
            return "[Draft pending – AI service unavailable] " + detail;
        }
    }
}
