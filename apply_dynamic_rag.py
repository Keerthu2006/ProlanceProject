import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_chat = '''import requests

def retrieve_rag_context(user_query: str) -> str:
    query = user_query.lower()
    live_data = ""
    
    try:
        if "freelancer" in query or "talent" in query or "skills" in query:
            res = requests.get("http://localhost:8080/api/freelancers", timeout=3)
            if res.status_code == 200:
                freelancers = res.json()
                live_data += "\\n[LIVE DATABASE - FREELANCERS]\\n"
                for i, f in enumerate(freelancers[:15]): # Limit to top 15 to save prompt space
                    skills = ", ".join(f.get("skills", []))
                    name = f.get("user", {}).get("fullName", "Unknown")
                    live_data += f"- {name}: {f.get('headline', '')} | Skills: {skills} | Rate: /hr\\n"
                    
        if "project" in query or "job" in query or "work" in query:
            res = requests.get("http://localhost:8080/api/projects/open", timeout=3)
            if res.status_code == 200:
                projects = res.json()
                live_data += "\\n[LIVE DATABASE - OPEN PROJECTS]\\n"
                for i, p in enumerate(projects[:10]):
                    skills = ", ".join(p.get("skillsRequired", []))
                    live_data += f"- '{p.get('title')}' by {p.get('clientName')} | Budget: - | Skills: {skills}\\n"
                    
    except Exception as e:
        print("Failed to fetch live data:", e)
        
    if not live_data:
        live_data = "No specific live database records queried. ProLance is an AI Neglect-free platform."
        
    return live_data

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        import requests
        
        # 1. Dynamically fetch RAG Context from the Spring Boot Database
        rag_context = retrieve_rag_context(req.message)
        
        # 2. Inject into Llama Prompt
        system_prompt = (
            f"You are ProLance AI, an intelligent platform assistant running locally.\\n"
            f"You are speaking to a user named {req.user_name} (Role: {req.role}).\\n"
            f"Use the LIVE DATABASE context provided below to answer the user's question.\\n"
            f"If they ask about projects or freelancers, reference the live data.\\n"
            f"Keep your answer helpful, concise, and professional.\\n\\n"
            f"--- LIVE DATABASE RAG CONTEXT ---\\n{rag_context}\\n\\n"
            f"--- DASHBOARD CONTEXT ---\\n{req.dashboard_context}"
        )

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

old_chat = re.search(r'import requests\s*def retrieve_rag_context.*?return ChatResponse\(response=reply\)', content, flags=re.DOTALL).group(0)
content = content.replace(old_chat, new_chat)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
