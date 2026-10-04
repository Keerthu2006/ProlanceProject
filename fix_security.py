import re

with open('backend/src/main/java/com/trigrowth/config/SecurityConfig.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"/api/auth/**",', '"/api/auth/**", "/api/seed-demo",')

with open('backend/src/main/java/com/trigrowth/config/SecurityConfig.java', 'w', encoding='utf-8') as f:
    f.write(content)
