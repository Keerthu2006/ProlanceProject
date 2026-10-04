import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_chat = '''@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    msg_lower = req.message.lower()
    if any(w in msg_lower for w in ["project", "post", "create"]):
        reply = ("To post a project on ProLance:\\n1. Go to your Dashboard\\n2. Click 'Post Project'\\n3. Fill in title, description, budget, and required skills.\\n\\nOur AI will instantly analyze your project and match you with the Top 5 most relevant freelancers using semantic TF-IDF profiling!")
    elif any(w in msg_lower for w in ["bid", "apply", "proposal"]):
        reply = ("To bid on a project:\\n1. Browse open projects in your Dashboard\\n2. Click 'Place Bid' on any project that matches your skills\\n3. Write a compelling cover letter.\\n\\nPro-Tip: Ensure your profile skills are fully updated so our AI Matchmaker can recommend you to top clients automatically.")
    elif any(w in msg_lower for w in ["ai", "neglect", "smart", "monitor", "recommendation"]):
        reply = ("ProLance AI continuously monitors 4 key neglect areas to ensure platform health:\\n\\n1. Customer Neglect: Detects inactive users and auto-engages them.\\n2. Product Neglect: Monitors feature adoption and guides confused users.\\n3. Financial Neglect: Random Forest ML predicts revenue risks 6 months ahead.\\n4. Opportunity Neglect: Analyzes market trends and freelancer skill gaps.\\n\\nEverything is logged in the Executive Smart Monitor!")
    elif any(w in msg_lower for w in ["team", "teamlancer", "formation"]):
        reply = ("TeamLancer is our exclusive Team Formation feature:\\n\\nInstead of hiring a single freelancer, you can request a full team (e.g., 1 Designer, 1 Frontend, 1 Backend). Our AI will automatically group compatible freelancers together into a seamless workspace with built-in escrow and milestone tracking.")
    elif any(w in msg_lower for w in ["hello", "hi", "hey"]):
        reply = (f"Hello there! I'm the ProLance AI Assistant.\\n\\nI can help you understand our AI Neglect Models, guide you through posting a project, or explain how our TeamLancer feature works. How can I assist you today?")
    else:
        reply = (f"I'm ProLance AI, your intelligent platform assistant.\\n\\nI am heavily optimized to answer questions about the ProLance ecosystem. Try asking me about:\\n- 'How do I post a project?'\\n- 'How does the AI Neglect Engine work?'\\n- 'What is TeamLancer?'\\n- 'How do I apply for bids?'")
    import time
    time.sleep(0.3)
    return ChatResponse(response=reply)'''

new_chat = '''import google.generativeai as genai

# Configure gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
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

if old_chat in content:
    content = content.replace(old_chat, new_chat)
else:
    print("WARNING: Old chat endpoint not found exactly.")
    # Use regex
    content = re.sub(r'@app\.post\("/chat", response_model=ChatResponse\).*?return ChatResponse\(response=reply\)', new_chat, content, flags=re.DOTALL)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
