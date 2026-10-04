import re

with open('backend/src/main/resources/application.yml', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('host: ', 'host: smtp.gmail.com')
content = content.replace('username: ', 'username: ')
content = content.replace('password: ', 'password: ')

with open('backend/src/main/resources/application.yml', 'w', encoding='utf-8') as f:
    f.write(content)
