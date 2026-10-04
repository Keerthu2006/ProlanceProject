import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("model = genai.GenerativeModel('gemini-1.5-flash')", "model = genai.GenerativeModel('gemini-flash-latest')")

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
