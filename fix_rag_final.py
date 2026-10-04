import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_chat_block = '''@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        # 1. Retrieve RAG Context from the "huge dataset"
        rag_context = retrieve_rag_context(req.message)
        
        # 2. Simulate Local GPT Generation
        reply = "Based on our vector database analysis:\\n\\n" + rag_context + "\\n\\nDoes this project scope align with your requirements? I can help you refine it further or you can post it directly from your dashboard."
        
    except Exception as e:
        reply = "I apologize, my local RAG engine encountered an error: " + str(e)
    
    return ChatResponse(response=reply)'''

content = re.sub(r'@app\.post\("/chat".*', new_chat_block, content, flags=re.DOTALL)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
