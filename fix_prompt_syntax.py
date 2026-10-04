import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the broken system_prompt assignment
new_prompt = '''
        system_prompt = f"""You are ProLance AI, an intelligent platform assistant running locally.
You are speaking to a user named {req.user_name} (Role: {req.role}).
IMPORTANT: You HAVE access to real-time database information. The live data is provided to you below.
You MUST use the provided LIVE DATABASE RAG CONTEXT to answer the user's question.
If they ask for top freelancers, list them from the context below.

--- LIVE DATABASE RAG CONTEXT ---
{rag_context}

--- DASHBOARD CONTEXT ---
{req.dashboard_context}"""
'''

content = re.sub(r'system_prompt = \([^)]+\)', new_prompt.strip(), content)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
