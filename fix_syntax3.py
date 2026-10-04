import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_chat_block = '''@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        rag_context = retrieve_rag_context(req.message)
        prompt = "System: You are ProLance AI.\\n" + rag_context + "\\nUser: " + req.message + "\\nProLance AI:"
        if local_rag_pipe:
            output = local_rag_pipe(prompt, return_full_text=False, temperature=0.7, truncation=True, max_length=150)
            reply = output[0]['generated_text'].strip()
            if len(reply) < 10:
                reply = "Based on our platform data: " + rag_context.replace("RAG Context: ", "") + "\\n\\nTo proceed, please post the project from your dashboard with the suggested skills."
        else:
            reply = "[RAG Fallback] " + rag_context + "\\nLocal model unavailable."
    except Exception as e:
        reply = "I apologize, my local RAG engine encountered an error: " + str(e)
    
    return ChatResponse(response=reply)'''

content = re.sub(r'@app\.post\("/chat".*', new_chat_block, content, flags=re.DOTALL)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
