import os

path = "backend/src/main/java/com/trigrowth/controller/ProjectController.java"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Inject NotificationService
content = content.replace(
    "private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;",
    "private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;\n    private final com.trigrowth.service.NotificationService notificationService;"
)

# Replace convertAndSend with notificationService.send for TEAM
content = content.replace("""messagingTemplate.convertAndSend("/topic/notifications/" + team.getLeader().getId(), Map.of(
                            "title", "Team Project Invitation",
                            "body", msg,
                            "type", "INFO"
                    ));""", """notificationService.send(team.getLeader(), "Team Project Invitation", msg, "INFO");""")

# Replace convertAndSend with notificationService.send for INDIVIDUAL
content = content.replace("""messagingTemplate.convertAndSend("/topic/notifications/" + uId, Map.of(
                        "title", "Project Invitation",
                        "body", msg,
                        "type", "INFO"
                ));""", """userRepository.findById(uId).ifPresent(freelancer -> {
                    notificationService.send(freelancer, "Project Invitation", msg, "INFO");
                });""")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

