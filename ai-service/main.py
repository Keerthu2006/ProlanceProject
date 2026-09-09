"""
main.py – UPDATED: Smart event routing so each event only triggers its relevant agent.
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
from agents import customer_agent, product_agent, financial_agent, opportunity_agent, freelancer_agent
from engine import decision_engine, recommendation_engine

load_dotenv()

app = FastAPI(
    title="TriGrowth AI Core",
    description="Multi-agent AI engine for proactive platform growth intelligence.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Event → Agent routing map ──────────────────────────────────────────────
EVENT_AGENT_MAP = {
    # Customer neglect
    "CLIENT_INACTIVITY_REPORT":   [customer_agent],
    "USER_REGISTERED":            [customer_agent],
    # Product neglect
    "FEATURE_USAGE_REPORT":       [product_agent],
    "PRODUCT_NEGLECT_REPORT":     [product_agent],
    # Financial / revenue neglect
    "REVENUE_REPORT":             [financial_agent],
    "REVENUE_NEGLECT_REPORT":     [financial_agent],
    # Opportunity neglect (market trends)
    "MARKET_TREND_REPORT":        [opportunity_agent],
    "OPPORTUNITY_NEGLECT_REPORT": [opportunity_agent],
    # Freelancer ghosting
    "FREELANCER_GHOSTING_REPORT": [freelancer_agent],
}

# Default: run all agents for unknown event types
DEFAULT_AGENTS = [customer_agent, product_agent, financial_agent, opportunity_agent, freelancer_agent]


@app.get("/health")
def health():
    return {"status": "ok", "service": "trigrowth-ai-core", "version": "2.0.0"}


@app.post("/analyze/event", response_model=AnalyzeEventResponse)
def analyze_event(ctx: EventContext):
    """
    Smart-routed endpoint. Routes each event to only its relevant agent(s).
    """
    agents_to_run = EVENT_AGENT_MAP.get(ctx.event_type, DEFAULT_AGENTS)

    # 1. Run only the relevant agents
    results = [agent.analyze(ctx) for agent in agents_to_run]

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
    Generates draft content for AutomationService.
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
            model="groq/compound-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=400,
        )
        content = chat.choices[0].message.content.strip()
    except Exception:
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

    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel(
                model_name='gemini-2.0-flash',
                system_instruction=system_context
            )
            response = model.generate_content(req.message)
            return ChatResponse(response=response.text)
        except Exception:
            try:
                model = genai.GenerativeModel('gemini-1.5-flash-latest')
                prompt = f"{system_context}\n\nUser: {req.message}"
                response = model.generate_content(prompt)
                return ChatResponse(response=response.text)
            except Exception:
                pass

    if groq_key:
        try:
            import groq as groq_lib
            client = groq_lib.Groq(api_key=groq_key)
            chat_resp = client.chat.completions.create(
                model="groq/compound-mini",
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
        reply = ("ProLance AI continuously monitors 5 neglect areas:\n"
                 "• Customer Neglect — detects inactive clients and auto-engages\n"
                 "• Product Neglect — guides confused users through features\n"
                 "• Financial Neglect — Random Forest ML predicts revenue risks\n"
                 "• Opportunity Neglect — SEO trends + freelancer skill gap analysis\n"
                 "• Freelancer Neglect — detects ghosting freelancers in real-time\n"
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
                 f"I'm currently running in **Limited Template Mode** because the AI API is unavailable.\n\n"
                 f"I can still help you with these topics if you use keywords:\n"
                 f"• 'project' - Posting and managing projects\n"
                 f"• 'bid' - Applying for projects\n"
                 f"• 'ai' - Understanding AI recommendations\n"
                 f"• 'team' - Using TeamLancer features\n\n"
                 f"*(To restore full AI, please provide a valid GROQ_API_KEY or GEMINI_API_KEY in the .env file)*")

    return ChatResponse(response=reply)
import joblib
from pydantic import BaseModel
from typing import List

try:
    customer_rf = joblib.load('agents/customer_neglect_rf.pkl')
except Exception as e:
    customer_rf = None

class CustomerFeatureRow(BaseModel):
    id: str
    days_inactive: int
    projects_30d: int
    total_projects: int
    is_freelancer: int

class CustomerBatchRequest(BaseModel):
    customers: List[CustomerFeatureRow]

@app.post("/predict-customer-neglect-batch")
def predict_customer_neglect_batch(req: CustomerBatchRequest):
    if not customer_rf:
        return {"error": "Model not loaded"}
    
    results = []
    for c in req.customers:
        features = [[c.days_inactive, c.projects_30d, c.total_projects, c.is_freelancer]]
        churn_prob = customer_rf.predict_proba(features)[0][1]
        
        if churn_prob > 0.80: risk = "CRITICAL"; score = 85
        elif churn_prob > 0.60: risk = "HIGH"; score = 65
        elif churn_prob > 0.40: risk = "MEDIUM"; score = 45
        elif churn_prob > 0.20: risk = "LOW"; score = 25
        else: risk = "HEALTHY"; score = 5
            
        results.append({
            "id": c.id,
            "churn_prob": churn_prob,
            "risk": risk,
            "score": score
        })
    return {"results": results}
