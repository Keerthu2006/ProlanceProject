"""
Freelancer Neglect Agent
Analyzes the FREELANCER_GHOSTING_REPORT and outputs recommendations.
"""
import os
import google.generativeai as genai
from schemas import AgentResult, EventContext

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "DUMMY_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload
    
    ghosting_count = int(payload.get("ghosting_count", 0))
    freelancers = payload.get("freelancers", [])
    
    if ghosting_count == 0:
        return AgentResult(
            agent_name="FreelancerNeglectAgent",
            severity="LOW",
            score=10.0,
            summary="All freelancers are responding promptly. No ghosting detected.",
            raw_data=payload
        )
        
    worst_days = max([int(f.get("MAXDAYSUNREAD", f.get("maxDaysUnread", 0))) for f in freelancers] + [0])
    worst_fl = next((f for f in freelancers if int(f.get("MAXDAYSUNREAD", f.get("maxDaysUnread", 0))) == worst_days), {})
    
    if worst_days >= 7:
        severity = "CRITICAL"
        score = 90.0
    elif worst_days >= 3:
        severity = "HIGH"
        score = 75.0
    else:
        severity = "MEDIUM"
        score = 50.0
        
    worst_name = worst_fl.get("FREELANCERNAME", worst_fl.get("freelancerName", "a freelancer"))
        
    prompt = f"""
You are an AI platform manager for a freelance marketplace.
We just detected that {ghosting_count} freelancers are ignoring direct messages from active clients.

The worst offender is "{worst_name}", who has left client messages unread for {worst_days} days.

Severity: {severity}

In 2-3 sentences:
1. Explain why this specific level of ghosting ({worst_days} days) severely damages client trust.
2. Suggest an automated intervention (e.g., auto-pause freelancer profile, assign backup freelancer, escalate to admin).
3. Predict the immediate client churn impact if we don't fix this.
"""
    try:
        response = model.generate_content(prompt)
        summary = response.text.strip()
    except Exception:
        summary = f"Detected {ghosting_count} freelancers ghosting clients. Worst offender inactive for {worst_days} days. Recommend SMS ping."

    return AgentResult(
        agent_name="FreelancerNeglectAgent",
        severity=severity,
        score=score,
        summary=summary,
        raw_data=payload
    )
