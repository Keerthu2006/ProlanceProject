import re

with open('backend/src/main/resources/application.yml', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('    allowed-origins: "http://localhost: smtp.gmail.com', '    allowed-origins: "http://localhost:3000,http://localhost:5173"')

with open('backend/src/main/resources/application.yml', 'w', encoding='utf-8') as f:
    f.write(content)
