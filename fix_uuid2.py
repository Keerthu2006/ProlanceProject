import re

with open("backend/src/main/java/com/trigrowth/controller/OwnerController.java", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Long targetUserId = Long.parseLong(payload.get(\"targetUserId\"));", "java.util.UUID targetUserId = java.util.UUID.fromString(payload.get(\"targetUserId\"));")

with open("backend/src/main/java/com/trigrowth/controller/OwnerController.java", "w", encoding="utf-8") as f:
    f.write(content)
