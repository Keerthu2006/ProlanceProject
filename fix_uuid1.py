import re

with open("backend/src/main/java/com/trigrowth/service/AutomationService.java", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("public String manualExecuteTargeted(String actionType, String detail, Long targetUserId) {", "public String manualExecuteTargeted(String actionType, String detail, java.util.UUID targetUserId) {")

with open("backend/src/main/java/com/trigrowth/service/AutomationService.java", "w", encoding="utf-8") as f:
    f.write(content)
