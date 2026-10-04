import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Llama 3.2 model with Qwen 2.5 0.5B, and reduce RAG sizes to 5.
content = content.replace('freelancers[:15]', 'freelancers[:5]')
content = content.replace('projects[:10]', 'projects[:5]')
content = content.replace('"model": "llama3.2:latest"', '"model": "qwen2.5:0.5b"')

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
