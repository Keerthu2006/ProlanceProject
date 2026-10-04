import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the broken syntax
new_prompt_code = 'prompt = "System: You are ProLance AI.\\n" + rag_context + "\\nUser: " + req.message + "\\nProLance AI:"\n'
new_fallback_code = 'reply = "Based on our platform data: " + rag_context.replace("RAG Context: ", "") + "\\n\\nTo proceed, please post the project from your dashboard with the suggested skills."\n'
new_error_code = 'reply = "[RAG Fallback] " + rag_context + "\\nLocal model unavailable."\n'

content = re.sub(r'prompt = f"System: You are ProLance AI.\n.*?\n', new_prompt_code, content)
content = re.sub(r'reply = f"Based on our platform data: .*?\n', new_fallback_code, content)
content = re.sub(r'reply = f"\[RAG Fallback\].*?\n', new_error_code, content)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
