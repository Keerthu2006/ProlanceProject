import re

with open('backend/src/main/resources/application.yml', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('    base-url: http://localhost: smtp.gmail.com', '    base-url: http://localhost:8001')

with open('backend/src/main/resources/application.yml', 'w', encoding='utf-8') as f:
    f.write(content)
