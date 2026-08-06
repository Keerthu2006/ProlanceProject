"""
Product Neglect Agent
Detects under-used platform features (like Team Formation) and analyzes if users are unaware of their availability.
"""
import os
import json
import google.generativeai as genai
from schemas import AgentResult, EventContext

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "DUMMY_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload
    feature_key         = payload.get("feature_key", "UNKNOWN")
    adoption_rate       = float(payload.get("adoption_rate", 0.0))
    feature_complaints_count = int(payload.get("feature_complaints_count", 0))
    unaware_of_feature_flag = bool(payload.get("unaware_of_feature_flag", False))
    recent_reviews_text = payload.get("recent_reviews_text", "")

    # Rule Engine for Product Neglect
    score = 0.0
    
    if adoption_rate < 0.10:
        score += 40
    elif adoption_rate < 0.25:
        score += 20

    if unaware_of_feature_flag:
        score += 35
        
    if feature_complaints_count > 0:
        score += 25

    score = min(score, 100)

    if score >= 75:
        severity = "HIGH"
    elif score >= 40:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    # Explanation via LLM
    prompt = f"""
    You are a UX researcher analyzing a freelancer platform's product health.
    A Rule Engine has flagged the '{feature_key}' feature with a Product Neglect risk level of {severity}.
    
    Metrics:
    - Adoption Rate: {adoption_rate * 100:.1f}%
    - Feature Complaints Count: {feature_complaints_count}
    - Users seem unaware of feature: {unaware_of_feature_flag}
    - Recent Reviews/Feedback: "{recent_reviews_text}"
    
    Write a concise summary (1-2 sentences) explaining the problem. 
    Then, suggest exactly one automated business action (like sending an educational email about how to form a team).
    Do NOT output JSON. Just output plain text.
    """
    
    summary = ""
    try:
        response = model.generate_content(prompt)
        summary = response.text.strip()
    except Exception as e:
        summary = f"Feature '{feature_key}' has high product neglect risk due to low adoption."

    return AgentResult(
        agent_name="ProductNeglectAgent",
        severity=severity,
        score=round(score, 2),
        summary=summary,
        raw_data={
            "feature_key": feature_key,
            "adoption_rate": adoption_rate,
            "unaware_of_feature_flag": unaware_of_feature_flag
        },
    )
