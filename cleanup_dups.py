import re

with open('backend/src/main/java/com/trigrowth/service/RecommendationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

cleanup_code = """    @jakarta.annotation.PostConstruct
    public void cleanupDuplicates() {
        try {
            List<Recommendation> allPending = recommendationRepository.findByStatus("PENDING");
            java.util.Set<String> seen = new java.util.HashSet<>();
            for (Recommendation r : allPending) {
                if (r.getAgentResult() != null) {
                    String key = r.getAgentResult().getAgentName() + "|" + r.getRecommendedAction();
                    if (seen.contains(key)) {
                        recommendationRepository.delete(r);
                        log.info("Deleted duplicate recommendation ID: {}", r.getId());
                    } else {
                        seen.add(key);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to cleanup", e);
        }
    }

    public void persistAiResponse"""

content = content.replace("    public void persistAiResponse", cleanup_code)

with open('backend/src/main/java/com/trigrowth/service/RecommendationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
