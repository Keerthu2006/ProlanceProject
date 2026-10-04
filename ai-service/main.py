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
    MatchmakingRequest, MatchmakingResponse, MatchScore,
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
    user_name: str = "User"
    dashboard_context: str = ""

class ChatResponse(BaseModel):
    response: str

def retrieve_rag_context(user_query: str, dashboard_context: str = "") -> str:
    query = user_query.lower()
    live_data = ""

    # If the frontend has already supplied the user's own projects in dashboard_context,
    # do NOT overwrite with platform-wide open projects — it confuses the small Qwen model
    # into listing generic "Project 1, Project 5" IDs instead of real titles.
    has_personal_projects = "Client's Active Projects:" in dashboard_context or "Assigned Work:" in dashboard_context

    try:
        import requests
        if "freelancer" in query or "talent" in query or "skills" in query or "who" in query:
            res = requests.get("http://localhost:8080/api/freelancers", timeout=3)
            if res.status_code == 200:
                freelancers = res.json()
                live_data += "\n[LIVE DATABASE - FREELANCERS]\n"
                for i, f in enumerate(freelancers[:5]):
                    skills = ", ".join(f.get("skills", []))
                    name = f.get("user", {}).get("fullName", "Unknown")
                    live_data += f"- {name}: {f.get('headline', '')} | Skills: {skills} | Rate: ${f.get('hourlyRate', 0)}/hr\n"

        # Only query open projects from DB when user's personal project list is NOT already in context
        if not has_personal_projects and ("project" in query or "job" in query or "work" in query):
            res = requests.get("http://localhost:8080/api/projects/open", timeout=3)
            if res.status_code == 200:
                projects = res.json()
                live_data += "\n[LIVE DATABASE - OPEN PROJECTS]\n"
                for i, p in enumerate(projects[:5]):
                    skills = ", ".join(p.get("skillsRequired", []))
                    live_data += f"- '{p.get('title')}' by {p.get('clientName')} | Budget: ${p.get('budgetMin')}-${p.get('budgetMax')} | Skills: {skills}\n"

    except Exception as e:
        print("Failed to fetch live data:", e)

    if not live_data:
        live_data = "No additional live database records needed."
    return live_data

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        import requests
        rag_context = retrieve_rag_context(req.message, req.dashboard_context)
        
        system_prompt = (
            "You are ProLance AI, an intelligent platform assistant running locally.\n"
            "You are speaking to a user named " + req.user_name + " (Role: " + req.role + ").\n"
            "IMPORTANT: You HAVE access to real-time database information.\n"
            "You MUST use the provided LIVE DATABASE RAG CONTEXT to answer the user's question when they ask about their data.\n"
            "CRITICAL: If the user asks you to GENERATE new content, write a draft, or brainstorm (e.g., 'help me write a project description'), DO NOT just copy an existing project from the context. Generate fresh, high-quality, original content tailored to their specific request.\n\n"
            "--- LIVE DATABASE RAG CONTEXT ---\n" + rag_context + "\n\n"
            "--- DASHBOARD CONTEXT ---\n" + req.dashboard_context
        )

        response = requests.post("http://127.0.0.1:11434/api/chat", json={
            "model": "qwen2.5:0.5b",
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


class FinancialNeglectRequest(BaseModel):
    budget: float = 5000.0
    agreed_amount: float = 4750.0
    payment_delay: float = 0.0
    overdue_milestones: int = 0
    client_rating: float = 4.5
    freelancer_rating: float = 4.8
    revenue_drop: float = 0.0

@app.post("/predict-financial-neglect")
def predict_financial_neglect(req: FinancialNeglectRequest):
    budget_utilization = req.agreed_amount / req.budget if req.budget > 0 else 1.0
    rf_model = financial_agent.rf_model
    if rf_model is not None:
        import pandas as pd
        features_df = pd.DataFrame([{
            'budget': req.budget,
            'agreed_amount': req.agreed_amount,
            'budget_utilization': budget_utilization,
            'payment_delay': req.payment_delay,
            'overdue_milestones': req.overdue_milestones,
            'client_rating': req.client_rating,
            'freelancer_rating': req.freelancer_rating,
        }])
        pred = int(rf_model.predict(features_df)[0])
        import numpy as np
        proba = rf_model.predict_proba(features_df)[0]
        confidence = float(np.max(proba)) * 100.0
    else:
        # Rule-based fallback
        if req.payment_delay > 14 or req.overdue_milestones > 1 or req.revenue_drop > 20:
            pred = 2
        elif req.payment_delay > 5 or req.overdue_milestones == 1 or req.revenue_drop > 10:
            pred = 1
        else:
            pred = 0
        confidence = 65.0

    severity_map = {2: ("CRITICAL", 85.0), 1: ("MEDIUM", 50.0), 0: ("HEALTHY", 15.0)}
    risk, score = severity_map.get(pred, ("HEALTHY", 15.0))
    if req.revenue_drop > 25 and score < 75:
        score = 80.0
        risk = "HIGH"

    feature_dict = {
        "budget": req.budget, "agreed_amount": req.agreed_amount,
        "payment_delay": req.payment_delay, "overdue_milestones": req.overdue_milestones,
        "client_rating": req.client_rating, "drop_percentage": req.revenue_drop,
    }
    summary = financial_agent._groq_summary(risk, feature_dict)

    return {
        "rf_prediction": pred,
        "rf_confidence": round(confidence, 1),
        "risk": risk,
        "score": score,
        "summary": summary,
        "budget": req.budget,
        "payment_delay": req.payment_delay,
        "overdue_milestones": req.overdue_milestones,
        "revenue_drop": req.revenue_drop
    }


class ProductNeglectRequest(BaseModel):
    feature_key: str = "team_formation"
    avg_feature_adoption_pct: float = 45.0
    incomplete_profile_pct: float = 30.0
    transparency_deficit_pct: float = 35.0
    complaints: int = 0
    reviews: List[str] = []

@app.post("/predict-product-neglect")
def predict_product_neglect(req: ProductNeglectRequest):
    feature_deficit_pct = max(0.0, 100.0 - req.avg_feature_adoption_pct)
    # 3-pillar calculation:
    score = (
        (0.40 * feature_deficit_pct) +
        (0.35 * req.incomplete_profile_pct) +
        (0.25 * req.transparency_deficit_pct)
    )
    if req.complaints > 0:
        score += min(req.complaints * 3.0, 10.0)
    score = max(0.0, min(100.0, round(score, 1)))

    if score >= 65:
        risk = "CRITICAL"
    elif score >= 45:
        risk = "HIGH"
    elif score >= 25:
        risk = "MEDIUM"
    else:
        risk = "HEALTHY"

    summary = product_agent._generate_summary(
        risk, req.feature_key, req.avg_feature_adoption_pct,
        req.incomplete_profile_pct, req.transparency_deficit_pct,
        req.complaints, req.reviews
    )

    return {
        "score": score,
        "risk": risk,
        "summary": summary,
        "feature_adoption_pct": round(req.avg_feature_adoption_pct, 1),
        "feature_deficit_pct": round(feature_deficit_pct, 1),
        "incomplete_profile_pct": round(req.incomplete_profile_pct, 1),
        "transparency_deficit_pct": round(req.transparency_deficit_pct, 1)
    }


class OpportunityNeglectRequest(BaseModel):
    platform_skill_supply: dict = {}

@app.post("/predict-opportunity-neglect")
def predict_opportunity_neglect(req: OpportunityNeglectRequest):
    ctx = EventContext(
        event_type="MARKET_TREND_REPORT",
        entity_type="SYSTEM",
        entity_id="0",
        payload={"platform_skill_supply": req.platform_skill_supply}
    )
    result = opportunity_agent.analyze(ctx)
    return {
        "score": result.score,
        "risk": result.severity,
        "summary": result.summary,
        "raw_data": result.raw_data
    }
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

@app.post("/match", response_model=MatchmakingResponse)
def match_freelancers(req: MatchmakingRequest):
    matches = []
    proj_skills_lower = [s.lower() for s in req.project_skills] if req.project_skills else []
    project_text = getattr(req, 'project_title', '') + " " + getattr(req, 'project_description', '') + " " + " ".join(proj_skills_lower)
    
    scored_freelancers = []
    
    # 1. Prepare documents for TF-IDF
    documents = [project_text]
    freelancer_texts = []
    
    for f in req.freelancers:
        f_skills = getattr(f, 'skills', []) or []
        f_headline = getattr(f, 'headline', '') or ''
        f_bio = getattr(f, 'bio', '') or ''
        f_text = f"{' '.join(f_skills)} {f_headline} {f_bio}".lower()
        freelancer_texts.append(f_text)
        documents.append(f_text)
        
    # 2. Calculate TF-IDF and Cosine Similarity
    cosine_scores = []
    if any(freelancer_texts) and project_text.strip():
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(documents)
            cosine_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            cosine_scores = [0.0] * len(req.freelancers)
    else:
        cosine_scores = [0.0] * len(req.freelancers)

    for i, f in enumerate(req.freelancers):
        score = 10.0
        reasoning = ["Baseline AI"]
        
        f_skills = getattr(f, 'skills', []) or []
        f_skills_lower = [s.lower() for s in f_skills]
        
        # Jaccard / Set Intersection
        overlap = set(proj_skills_lower).intersection(set(f_skills_lower))
        if overlap:
            score += len(overlap) * 15.0
            reasoning.append(f"Matches {len(overlap)} exact skills")
            
        # Cosine Similarity Score
        cos_sim = cosine_scores[i]
        if cos_sim > 0.05:
            boost = cos_sim * 40.0 
            score += boost
            reasoning.append(f"TF-IDF Semantic Match: {cos_sim:.2f}")
            
        import random
        score += random.uniform(0, 5.0)
        score = min(score, 99.0)
        
        f_id = getattr(f, 'id', None)
        if f_id is not None:
            f_name = getattr(f, 'name', None) or f"Freelancer #{str(f_id)[:8]}"
            f_rate = getattr(f, 'hourly_rate', 0.0)
            display_name = f"{f_name} (${f_rate}/hr)" if f_rate else f_name
            
            scored_freelancers.append({
                "id": str(f_id),
                "name": display_name,
                "score": score,
                "skills": f_skills,
                "reason": " - ".join(reasoning)
            })
            
    scored_freelancers.sort(key=lambda x: x["score"], reverse=True)
    
    # 3. Combinatorics for Team Projects
    if getattr(req, 'project_type', None) == "TEAM" and getattr(req, 'team_size', 1) > 1:
        import itertools
        team_size = min(req.team_size, len(scored_freelancers))
        if team_size > 1:
            best_teams = []
            for combo in itertools.combinations(scored_freelancers[:10], team_size):
                combo_skills = set()
                for member in combo:
                    combo_skills.update([s.lower() for s in member["skills"]])
                
                covered = set(proj_skills_lower).intersection(combo_skills)
                coverage_pct = len(covered) / len(proj_skills_lower) if proj_skills_lower else 1.0
                
                avg_score = sum(m["score"] for m in combo) / team_size
                team_score = min(99.9, avg_score + (coverage_pct * 30.0))
                
                team_ids = ",".join([m["id"] for m in combo])
                
                best_teams.append({
                    "ids": team_ids,
                    "score": team_score,
                    "covered": len(covered),
                    "total": len(proj_skills_lower)
                })
            
            best_teams.sort(key=lambda x: x["score"], reverse=True)
            for i, t in enumerate(best_teams[:5]):
                matches.append(MatchScore(
                    freelancer_id=t["ids"],
                    freelancer_name=f"AI Optimized Team (Covers {t['covered']}/{t['total']} skills)",
                    score=round(t["score"], 1),
                    reason="Combined skills perfectly match the project via Algorithmic Grouping."
                ))
            return MatchmakingResponse(matches=matches)

    for f in scored_freelancers[:5]:
        matches.append(MatchScore(
            freelancer_id=f["id"],
            freelancer_name=f["name"],
            score=round(f["score"], 1),
            reason=f["reason"]
        ))
        
    return MatchmakingResponse(matches=matches)

    # Individual Matching
    for f in scored_freelancers[:5]:
        matches.append(MatchScore(
            freelancer_id=f["id"],
            freelancer_name=f["name"],
            score=round(f["score"], 1),
            reason=f["reason"]
        ))
        
    return MatchmakingResponse(matches=matches)