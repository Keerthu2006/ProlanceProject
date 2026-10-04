import re

with open('backend/src/main/java/com/trigrowth/service/RecommendationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """                Recommendation rec = Recommendation.builder()
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

                recommendationRepository.save(rec);"""

new_block = """                Recommendation rec = Recommendation.builder()
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

                // Deduplication check
                boolean duplicateExists = recommendationRepository.findByStatus("PENDING").stream()
                        .anyMatch(r -> r.getAgentResult() != null 
                                && r.getAgentResult().getAgentName().equals(topAgentResult.getAgentName())
                                && r.getRecommendedAction().equals(rec.getRecommendedAction()));
                
                if (duplicateExists) {
                    log.info("Duplicate PENDING recommendation skipped for agent: {}", topAgentResult.getAgentName());
                    return;
                }

                recommendationRepository.save(rec);"""

content = content.replace(old_block, new_block)

with open('backend/src/main/java/com/trigrowth/service/RecommendationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
