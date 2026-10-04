import re
with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()
with open('chat_block.py', 'r', encoding='utf-8') as f:
    new_chat = f.read()
content = re.sub(r'def retrieve_rag_context.*', new_chat, content, flags=re.DOTALL)
with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
