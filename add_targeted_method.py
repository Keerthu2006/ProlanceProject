import re

with open("backend/src/main/java/com/trigrowth/service/AutomationService.java", "r", encoding="utf-8") as f:
    content = f.read()

new_method = """    public String manualExecuteTargeted(String actionType, String detail, Long targetUserId) {
        try {
            User target = userRepository.findById(targetUserId).orElse(null);
            if (target != null) {
                String subject = "TriGrowth AI - " + actionType.replace("_", " ");
                String text = "Hi " + target.getFullName() + ",\\n\\n" + detail;
                if (actionType.equals("OFFER_DISCOUNT")) {
                    subject = "Exclusive 20% Discount for Your Next Project!";
                    text = "Hi " + target.getFullName() + ",\\n\\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.";
                } else if (actionType.equals("NOTIFY_FREELANCERS")) {
                    subject = "TriGrowth AI - Project Availability";
                    text = "Hi " + target.getFullName() + ",\\n\\n" + detail;
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

    public String manualExecute(String actionType, String detail) {"""

content = content.replace("    public String manualExecute(String actionType, String detail) {", new_method)

with open("backend/src/main/java/com/trigrowth/service/AutomationService.java", "w", encoding="utf-8") as f:
    f.write(content)
