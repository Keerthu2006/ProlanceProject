import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

helper_method = """    private void sendEmailOrNotify(User target, String subject, String text) {
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

    private String callAiDraft"""

content = content.replace("    private String callAiDraft", helper_method)

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
