import re

with open('backend/src/main/resources/application.yml', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'username:\s*\$\{SMTP_USERNAME:.*?\}', 'username: adminprolance@gmail.com', content)
content = re.sub(r'password:\s*\$\{SMTP_PASSWORD:.*?\}', 'password: meoenzbetaqtkdxt', content)

with open('backend/src/main/resources/application.yml', 'w', encoding='utf-8') as f:
    f.write(content)
