"""
TriGrowth AI – FastAPI main entry point.
Runs on port 8001. Called by Spring Boot backend.
"""
import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    EventContext, AnalyzeEventResponse,
    DraftContentRequest, DraftContentResponse,
)
from agents import customer_agent, product_agent, financial_agent, opportunity_agent
from engine import decision_engine, recommendation_engine

load_dotenv()

app = FastAPI(
    title="TriGrowth AI Core",
    description="Multi-agent AI engine for proactive platform growth intelligence.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "trigrowth-ai-core"}


@app.post("/analyze/event", response_model=AnalyzeEventResponse)
def analyze_event(ctx: EventContext):
    """
    Core endpoint called by Spring Boot EventCollectorService.
    Runs all 4 agents, passes results to Decision Engine,
    optionally generates a Recommendation via LLM.
    """
    # 1. Run all agents
    results = [
        customer_agent.analyze(ctx),
        product_agent.analyze(ctx),
        financial_agent.analyze(ctx),
        opportunity_agent.analyze(ctx),
    ]

    # 2. Decision Engine picks the top result
    decision = decision_engine.decide(results)

    # 3. Recommendation Engine (only if threshold met)
    recommendation = None
    if decision.should_recommend:
        recommendation = recommendation_engine.generate(decision.top_agent, ctx)

    return AnalyzeEventResponse(
        agent_results=results,
        decision=decision,
        recommendation=recommendation,
    )


@app.post("/draft/content", response_model=DraftContentResponse)
def draft_content(req: DraftContentRequest):
    """
    Generates draft content (email, social post, landing page, etc.)
    for AutomationService when it executes DRAFT_* action types.
    """
    try:
        import groq as groq_lib
        client = groq_lib.Groq(api_key=os.getenv("GROQ_API_KEY", ""))

        prompt = (
            f"You are a professional business copywriter for a freelance platform called TriGrowth AI.\n"
            f"Generate a {req.action_type.replace('_', ' ').title()} based on this context:\n"
            f"{json.dumps(req.context, default=str)[:600]}\n\n"
            f"Keep it professional, concise, and actionable. Return only the content text."
        )

        chat = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=400,
        )
        content = chat.choices[0].message.content.strip()
    except Exception:
        # Fallback template
        content = (
            f"[AUTO-GENERATED {req.action_type}]\n\n"
            f"Dear Stakeholder,\n\n"
            f"Our TriGrowth AI platform has identified an action opportunity.\n"
            f"Context: {json.dumps(req.context, default=str)[:200]}\n\n"
            f"Please review and take appropriate action.\n\n"
            f"Best regards,\nTriGrowth AI Automation Engine"
        )

    return DraftContentResponse(content=content)

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    role: str = "user"

class ChatResponse(BaseModel):
    response: str

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """ProLance AI Chat endpoint - tries Gemini first, falls back to Groq, then template."""
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    groq_key = os.getenv("GROQ_API_KEY", "")

    system_context = (
        f"You are ProLance AI, an intelligent business assistant for the ProLance "
        f"AI-Powered Freelance Intelligence Platform. You are assisting a {req.role}. "
        f"Be concise, helpful, professional, and actionable. "
        f"Focus on freelancing, project management, AI insights, market intelligence, and business growth."
    )

    # Try Gemini first (gemini-2.0-flash is the correct current model)
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            # Use gemini-2.0-flash (current stable model)
            model = genai.GenerativeModel(
                model_name='gemini-2.0-flash',
                system_instruction=system_context
            )
            response = model.generate_content(req.message)
            return ChatResponse(response=response.text)
        except Exception as e:
            # Try gemini-1.5-flash-latest as fallback
            try:
                model = genai.GenerativeModel('gemini-1.5-flash-latest')
                prompt = f"{system_context}\n\nUser: {req.message}"
                response = model.generate_content(prompt)
                return ChatResponse(response=response.text)
            except Exception:
                pass  # Fall through to Groq

    # Try Groq as secondary
    if groq_key:
        try:
            import groq as groq_lib
            client = groq_lib.Groq(api_key=groq_key)
            chat_resp = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_context},
                    {"role": "user", "content": req.message},
                ],
                temperature=0.7,
                max_tokens=600,
            )
            return ChatResponse(response=chat_resp.choices[0].message.content.strip())
        except Exception:
            pass

    # Smart template fallback (always works, no API needed)
    msg_lower = req.message.lower()
    if any(w in msg_lower for w in ["project", "post", "create"]):
        reply = ("To post a project on ProLance:\n1. Go to your Client Dashboard\n2. Click 'Post Project'\n"
                 "3. Fill in title, description, budget, deadline, and required skills\n"
                 "4. AI will analyze and match you with the best freelancers\n"
                 "5. Review bids and accept the best proposal!")
    elif any(w in msg_lower for w in ["bid", "apply", "proposal"]):
        reply = ("To bid on a project:\n1. Browse open projects in your Freelancer Dashboard\n"
                 "2. Click 'Place Bid' on any project that matches your skills\n"
                 "3. Write a compelling cover letter and set your proposed amount\n"
                 "4. The client will review all bids and choose the best fit!")
    elif any(w in msg_lower for w in ["ai", "neglect", "recommendation"]):
        reply = ("ProLance AI continuously monitors 4 neglect areas:\n"
                 "• Customer Neglect — detects inactive clients and auto-engages\n"
                 "• Product Neglect — guides confused users through features\n"
                 "• Financial Neglect — ML predicts revenue risks and opportunities\n"
                 "• Opportunity Neglect — suggests trending skills and projects\n"
                 "Check the AI Intelligence Center for real-time insights!")
    elif any(w in msg_lower for w in ["cancel", "delete", "remove"]):
        reply = ("To cancel a project:\n• Within 48 hours of acceptance: use the AI Assistant or email support\n"
                 "• For open projects with no bids: simply delete from your project list\n"
                 "• Our AI will notify the freelancer automatically")
    elif any(w in msg_lower for w in ["team", "teamlancer"]):
        reply = ("TeamLancer (Team Projects) on ProLance:\n"
                 "• When posting a project, select 'Team' instead of 'Individual'\n"
                 "• Specify team size (2-10 members)\n"
                 "• AI matches you with compatible freelancer teams\n"
                 "• All team members see project updates in real-time!")
    else:
        reply = (f"Hello! I'm ProLance AI, your intelligent business assistant. 🚀\n\n"
                 f"I'm currently running in **Limited Template Mode** because the Gemini API quota limit has been reached (Error 429).\n\n"
                 f"I can still help you with these topics if you use keywords:\n"
                 f"• 'project' - Posting and managing projects\n"
                 f"• 'bid' - Applying for projects\n"
                 f"• 'ai' - Understanding AI recommendations\n"
                 f"• 'team' - Using TeamLancer features\n\n"
                 f"*(To restore full AI capabilities for manual questions, please check your Google Gemini API billing or provide a valid GROQ_API_KEY in the .env file)*")

    return ChatResponse(response=reply)
