import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_chat = '''import google.generativeai as genai

# Configure gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        system_prompt = (
            "You are the ProLance AI Assistant, an expert AI that helps users with their freelance projects.\\n"
            "ProLance is a platform that uses AI Neglect Models to prevent customer neglect, financial neglect, "
            "product neglect, and opportunity neglect. "
            "If the user asks you to write a project description or something similar, help them generate it professionally. "
            "If the user asks about the platform, explain ProLance's features clearly and enthusiastically."
        )
        response = model.generate_content(f"{system_prompt}\\n\\nUser Question: {req.message}")
        reply = response.text
    except Exception as e:
        reply = "I apologize, but my AI language model encountered an error: " + str(e)
    
    return ChatResponse(response=reply)'''

new_chat = '''import os
from groq import Groq

# Configure Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        system_prompt = (
            "You are the ProLance AI Assistant, an expert AI that helps users with their freelance projects.\\n"
            "ProLance is a platform that uses AI Neglect Models to prevent customer neglect, financial neglect, "
            "product neglect, and opportunity neglect. "
            "If the user asks you to write a project description or something similar, help them generate it professionally. "
            "If the user asks about the platform, explain ProLance's features clearly and enthusiastically."
        )
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        reply = completion.choices[0].message.content
    except Exception as e:
        reply = "I apologize, but my AI language model encountered an error: " + str(e)
    
    return ChatResponse(response=reply)'''

if old_chat in content:
    content = content.replace(old_chat, new_chat)
else:
    print("WARNING: Old chat endpoint not found exactly.")
    content = re.sub(r'import google\.generativeai as genai.*?return ChatResponse\(response=reply\)', new_chat, content, flags=re.DOTALL)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
