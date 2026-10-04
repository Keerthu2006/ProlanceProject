import re

with open('backend/src/main/java/com/trigrowth/controller/OwnerController.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove setCategory and setDeadline
content = content.replace('p.setCategory("Blockchain");\n', '')
content = content.replace('p.setDeadline(Instant.now().minus(20, java.time.temporal.ChronoUnit.DAYS));\n', '')

with open('backend/src/main/java/com/trigrowth/controller/OwnerController.java', 'w', encoding='utf-8') as f:
    f.write(content)
