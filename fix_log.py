import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'log.warn("AI draft call failed for {}: {}", actionType, e.getMessage());',
    'log.warn("AI draft call failed for {}: ", actionType, e);'
)

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
