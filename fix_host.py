import re

with open('backend/src/main/resources/application.yml', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'host:.*', 'host: smtp.gmail.com', content)

with open('backend/src/main/resources/application.yml', 'w', encoding='utf-8') as f:
    f.write(content)
