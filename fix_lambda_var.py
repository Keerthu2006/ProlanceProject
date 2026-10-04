import re

with open('backend/src/main/java/com/trigrowth/service/RecommendationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """                // Deduplication check
                boolean duplicateExists = recommendationRepository.findByStatus("PENDING").stream()
                        .anyMatch(r -> r.getAgentResult() != null 
                                && r.getAgentResult().getAgentName().equals(topAgentResult.getAgentName())
                                && r.getRecommendedAction().equals(rec.getRecommendedAction()));"""

new_code = """                // Deduplication check
                final String currentAgentName = topAgentResult.getAgentName();
                final String currentRecAction = rec.getRecommendedAction();
                boolean duplicateExists = recommendationRepository.findByStatus("PENDING").stream()
                        .anyMatch(r -> r.getAgentResult() != null 
                                && r.getAgentResult().getAgentName().equals(currentAgentName)
                                && r.getRecommendedAction().equals(currentRecAction));"""

content = content.replace(old_code, new_code)

with open('backend/src/main/java/com/trigrowth/service/RecommendationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
