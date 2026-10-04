with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('analysis:\\n\\n', 'analysis:\\n\\n'.replace('\\\\n', '\\n'))
content = content.replace('rag_context + "\\n\\nDoes', 'rag_context + "\\n\\nDoes'.replace('\\\\n', '\\n'))

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
