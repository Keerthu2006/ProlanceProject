import re

with open('backend/src/main/java/com/trigrowth/controller/ProjectController.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"id", 101', '"id", "101"')
content = content.replace('"id", 102', '"id", "102"')
content = content.replace('"id", 103', '"id", "103"')

with open('backend/src/main/java/com/trigrowth/controller/ProjectController.java', 'w', encoding='utf-8') as f:
    f.write(content)
