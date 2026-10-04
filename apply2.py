with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

with open('chat_block.py', 'r', encoding='utf-8') as f:
    new_chat = f.read()

# Safe replacement using string split and join
part1 = content.split('def retrieve_rag_context')[0]
content = part1 + new_chat

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
