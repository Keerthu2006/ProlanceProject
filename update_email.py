import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

replacement_discount = '''            // Send REAL Gmail email
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(senderEmail);
                msg.setTo(u.getEmail());
                msg.setSubject("Exclusive 20% Discount for Your Next Project!");
                msg.setText("Hi " + u.getFullName() + ",\\n\\n" +
                            "Use code " + code + " for 20% off your next project posting on ProLance.\\n\\n" +
                            "This offer is valid for the next 7 days.\\n\\n" +
                            "Log in now: http://localhost:5173/login\\n\\n" +
                            "The ProLance Team");
                mailSender.send(msg);
                log.info("Discount email sent to {}", u.getEmail());
            } catch (Exception e) {
                log.warn("Discount email failed for {} - {}", u.getEmail(), e.getMessage());
            }

            messagingTemplate.convertAndSend("/topic/notifications/" + u.getId(),
                    Map.of(
                        "type", "DISCOUNT_OFFER",'''

content = content.replace(
    'messagingTemplate.convertAndSend("/topic/notifications/" + u.getId(),\n                    Map.of(\n                        "type", "DISCOUNT_OFFER",',
    replacement_discount
)

replacement_nudge = '''                // Send REAL Gmail email
                try {
                    SimpleMailMessage msg = new SimpleMailMessage();
                    msg.setFrom(senderEmail);
                    msg.setTo(fp.getUser().getEmail());
                    msg.setSubject("ProLance: Optimize your profile to win more projects");
                    msg.setText("Hi " + fp.getUser().getFullName() + ",\\n\\n" +
                                "Clients are searching for freelancers with your skills, but your profile is missing: " + String.join(", ", missing) + ".\\n\\n" +
                                "Complete your profile today to get matched with high-paying projects.\\n\\n" +
                                "Log in to update your profile: http://localhost:5173/dashboard/freelancer\\n\\n" +
                                "The ProLance Team");
                    mailSender.send(msg);
                    log.info("Profile nudge email sent to {}", fp.getUser().getEmail());
                } catch (Exception e) {
                    log.warn("Profile nudge email failed for {} - {}", fp.getUser().getEmail(), e.getMessage());
                }

                messagingTemplate.convertAndSend("/topic/notifications/" + fp.getUser().getId(),
                        Map.of(
                            "type", "PROFILE_NUDGE",'''

content = content.replace(
    'messagingTemplate.convertAndSend("/topic/notifications/" + fp.getUser().getId(),\n                        Map.of(\n                            "type", "PROFILE_NUDGE",',
    replacement_nudge
)

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
