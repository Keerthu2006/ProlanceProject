import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_chat = '''import requests

def retrieve_rag_context(user_query: str) -> str:
    query = user_query.lower()
    if "disease predicator" in query or "disease predictor" in query or "healthcare" in query:
        return "ProLance has matched 120 AI healthcare projects recently. Key requirements typically include: Python, TensorFlow, PyTorch, HIPAA compliance, and Medical Data Analysis."
    elif "loan management" in query or "finance" in query:
        return "ProLance has successfully matched 85 Fintech projects this quarter. Key skills typically include: Java Spring Boot, React, Stripe API, PostgreSQL, and PCI-DSS Compliance."
    elif "team" in query:
        return "TeamLancer allows grouping multiple freelancers into cohesive units with escrow and milestones. It increases project success by 45%."
    else:
        return "ProLance is a platform for freelancers and clients to collaborate safely using AI Neglect Models."

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        rag_context = retrieve_rag_context(req.message)
        
        system_prompt = (
            "You are ProLance AI, an intelligent platform assistant running locally.\\n"
            "Use the provided RAG Context to answer the user's question.\\n"
            "Keep your answer helpful, concise, and professional.\\n\\n"
            f"RAG Context: {rag_context}"
        )

        # Call local Ollama API
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

old_chat = re.search(r'def retrieve_rag_context.*?return ChatResponse\(response=reply\)', content, flags=re.DOTALL).group(0)
content = content.replace(old_chat, new_chat)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
