import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix literal newlines in Java strings
content = content.replace("                          String text = \"Hi \" + target.getFullName() + \",\n\n\" + detail;", "                          String text = \"Hi \" + target.getFullName() + \",\\n\\n\" + detail;")

content = content.replace("                          String text = \"Hi \" + target.getFullName() + \",\n\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.\";", "                          String text = \"Hi \" + target.getFullName() + \",\\n\\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.\";")

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
