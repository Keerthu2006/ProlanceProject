import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken prompt manually
correct_prompt = '''        system_prompt = "You are ProLance AI, an intelligent platform assistant running locally.\\n" + \\
            "You are speaking to a user named " + req.user_name + " (Role: " + req.role + ").\\n" + \\
            "IMPORTANT: You HAVE access to real-time database information. The live data is provided to you below.\\n" + \\
            "You MUST use the provided LIVE DATABASE RAG CONTEXT to answer the user's question.\\n" + \\
            "If they ask for top freelancers, list them from the context below.\\n\\n" + \\
            "--- LIVE DATABASE RAG CONTEXT ---\\n" + rag_context + "\\n\\n" + \\
            "--- DASHBOARD CONTEXT ---\\n" + req.dashboard_context'''

# Find the broken block
# Let's just find anything between ag_context = retrieve_rag_context(req.message) and esponse = requests.post
broken_block = re.search(r'rag_context = retrieve_rag_context\(req\.message\)(.*?)response = requests\.post', content, flags=re.DOTALL).group(1)

content = content.replace(broken_block, "\\n\\n" + correct_prompt + "\\n\\n        ")

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
