import re

with open('backend/src/main/resources/application.yml', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''  mail:
    host: smtp.gmail.com
    port: 587
    username: adminprolance@gmail.com
    password: meoenzbetaqtkdxt
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true'''

# Use regex to replace the mail block
content = re.sub(r'  mail:.*?(?=\n  jackson:)', replacement + '\n', content, flags=re.DOTALL)

with open('backend/src/main/resources/application.yml', 'w', encoding='utf-8') as f:
    f.write(content)
