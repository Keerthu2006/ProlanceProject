import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_prompt = '''
        system_prompt = (
            f"You are ProLance AI, an intelligent platform assistant running locally.\\n"
            f"You are speaking to a user named {req.user_name} (Role: {req.role}).\\n"
            f"IMPORTANT: You HAVE access to real-time database information. The live data is provided to you below.\\n"
            f"You MUST use the provided LIVE DATABASE RAG CONTEXT to answer the user's question.\\n"
            f"If they ask for top freelancers, list them from the context below.\\n\\n"
            f"--- LIVE DATABASE RAG CONTEXT ---\\n{rag_context}\\n\\n"
            f"--- DASHBOARD CONTEXT ---\\n{req.dashboard_context}"
        )
'''

# Find the old system prompt block and replace it
content = re.sub(r'system_prompt = \([^)]+\)', new_prompt.strip(), content)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
