import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Update ChatRequest
new_request = '''class ChatRequest(BaseModel):
    message: str
    role: str = "user"
    user_name: str = "User"
    dashboard_context: str = ""'''
    
content = re.sub(r'class ChatRequest\(BaseModel\):\n\s*message: str\n\s*role: str = "user"', new_request, content)

# Update chat_endpoint
new_chat = '''@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        rag_context = retrieve_rag_context(req.message)
        
        system_prompt = (
            f"You are ProLance AI, an intelligent platform assistant running locally.\\n"
            f"You are speaking to a user named {req.user_name} (Role: {req.role}).\\n"
            f"Use the provided RAG Context and Platform Knowledge Base to answer the user's question.\\n"
            f"Keep your answer helpful, concise, and professional.\\n\\n"
            f"--- RAG Database Match ---\\n{rag_context}\\n\\n"
            f"{req.dashboard_context}"
        )

        import requests
        response = requests.post("http://127.0.0.1:11434/api/chat", json={
            "model": "llama3.2:latest",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            "stream": False
        }, timeout=120)
        
        if response.status_code == 200:
            reply = response.json()["message"]["content"]
        else:
            reply = "I apologize, my local Ollama server returned an error: " + response.text
            
    except Exception as e:
        reply = "I apologize, my local AI encountered an error communicating with Ollama: " + str(e)
        
    return ChatResponse(response=reply)'''

old_chat = re.search(r'@app\.post\("/chat", response_model=ChatResponse\).*?return ChatResponse\(response=reply\)', content, flags=re.DOTALL).group(0)
content = content.replace(old_chat, new_chat)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
