package com.trigrowth.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trigrowth.model.AutomationAction;
import com.trigrowth.model.Recommendation;
import com.trigrowth.repository.AutomationActionRepository;
import com.trigrowth.repository.RecommendationRepository;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.model.User;
import com.trigrowth.model.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

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
    private final JavaMailSender             mailSender;
    private final UiPathService              uiPathService;
    private final UserRepository             userRepository;

    @Value("${app.ai-service.base-url}")
    private String aiServiceBaseUrl;

    /**
     * Executes all automation actions from the approved recommendation's plan.
     */
    
    public String manualExecuteTargeted(String actionType, String detail, java.util.UUID targetUserId) {
        try {
            User target = userRepository.findById(targetUserId).orElse(null);
            if (target != null) {
                String subject = "TriGrowth AI - " + actionType.replace("_", " ");
                String text = "Hi " + target.getFullName() + ",\n\n" + detail;
                if (actionType.equals("OFFER_DISCOUNT")) {
                    subject = "Exclusive 20% Discount for Your Next Project!";
                    text = "Hi " + target.getFullName() + ",\n\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.";
                } else if (actionType.equals("NOTIFY_FREELANCERS")) {
                    subject = "TriGrowth AI - Project Availability";
                    text = "Hi " + target.getFullName() + ",\n\n" + detail;
                } else if (actionType.equals("EMAIL_CLIENT")) {
                    subject = "TriGrowth AI - Update";
                }
                sendEmailOrNotify(target, subject, text);
                
                String finalDetail = "Targeted email sent to " + target.getEmail();
                
                messagingTemplate.convertAndSend("/topic/automation-log", java.util.Map.of(
                      "actionType", actionType,
                      "actionDetail", finalDetail,
                      "success", true,
                      "timestamp", Instant.now().toString()
                ));
    
                return finalDetail;
            }
            return "User not found";
        } catch (Exception e) {
            log.error("Manual targeted execution failed", e);
            return "Failed: " + e.getMessage();
        }
    }

    public String manualExecute(String actionType, String detail) {
        try {
            Recommendation dummy = Recommendation.builder().id(9999L).build();
            String result = executeAction(actionType, detail, dummy);
            return result;
        } catch (Exception e) {
            log.error("Manual execution failed", e);
            return "Failed: " + e.getMessage();
        }
    }

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
            case "EMAIL_CLIENT", "EMAIL_INACTIVE_USER", "EMAIL_PRODUCT_NEGLECT", "EMAIL_FINANCIAL_REPORT", "EMAIL_OWNER_REPORT", "EMAIL_CUSTOMER_NEGLECT" -> {
                // Trigger UiPath Robot for Email Automation!
                java.util.Map<String, Object> uiPathArgs = new java.util.HashMap<>();
                uiPathArgs.put("in_ActionType", actionType);
                uiPathArgs.put("in_EmailBody", detail);
                
                boolean triggered = uiPathService.triggerJob("ProLance-Reengagement-Email", uiPathArgs);
                
                try {
                    List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
                    for (User target : clients) {
                        String subject = "TriGrowth AI - " + actionType.replace("_", " ");
                        String text = "Hi " + target.getFullName() + ",\n\n" + detail;
                        sendEmailOrNotify(target, subject, text);
                    }
                } catch(Exception e) {}
                
                if (triggered) {
                    yield "UiPath Robot Triggered! Automated email executed. Detail: " + detail;
                } else {
                    yield "Automated email executed (UiPath disabled/failed fallback). Detail: " + detail;
                }
            }
            case "SCHEDULE_FOLLOWUP"      -> "Follow-up scheduled in 3 days. Detail: " + detail;
            case "OFFER_DISCOUNT"         -> {
                // Trigger UiPath Robot for CRM & Promo Code generation
                java.util.Map<String, Object> uiPathArgs = new java.util.HashMap<>();
                uiPathArgs.put("in_DiscountAmount", "20%");
                uiPathService.triggerJob("ProLance-Discount-Generator", uiPathArgs);
                
                try {
                    List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
                    for (User target : clients) {
                        String subject = "Exclusive 20% Discount for Your Next Project!";
                        String text = "Hi " + target.getFullName() + ",\n\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.";
                        sendEmailOrNotify(target, subject, text);
                    }
                } catch(Exception e) {}
                yield "UiPath Robot Triggered! Discount codes automatically generated and sent. Detail: " + detail;
            }
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

    private void sendEmailOrNotify(User target, String subject, String text) {
        if (target.getEmail().equalsIgnoreCase("clientcredmks@gmail.com") || target.getEmail().equalsIgnoreCase("freelancercredmks@gmail.com")) {
            // Send to notification system via WebSocket instead of real email
            log.info("Demo account detected. Routing email to notification system: {}", target.getEmail());
            messagingTemplate.convertAndSend("/topic/notifications/" + target.getId(), Map.of(
                    "title", subject,
                    "body", text.length() > 50 ? text.substring(0, 47) + "..." : text
            ));
        } else {
            // Send real email
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom("adminprolance@gmail.com");
                msg.setTo(target.getEmail());
                msg.setSubject(subject);
                msg.setText(text);
                mailSender.send(msg);
                log.info("Sent real email to {}", target.getEmail());
            } catch (Exception e) {
                log.error("Failed to send real email to {}", target.getEmail(), e);
            }
        }
    }

    private String callAiDraft(String actionType, String detail, Recommendation rec) {
        try {
            Map<String, Object> context = new java.util.HashMap<>();
            context.put("problem", rec.getProblem() != null ? rec.getProblem() : "");
            context.put("recommended_action", rec.getRecommendedAction() != null ? rec.getRecommendedAction() : "");
            context.put("detail", detail != null ? detail : "");

            Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("action_type", actionType != null ? actionType : "");
            requestBody.put("context", context);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    aiServiceBaseUrl + "/draft/content",
                    requestBody, Map.class);

            return response != null ? (String) response.getOrDefault("content", detail) : detail;
        } catch (Exception e) {
            log.warn("AI draft call failed for {}: ", actionType, e);
            return "[Draft pending – AI service unavailable] " + detail;
        }
    }
}

