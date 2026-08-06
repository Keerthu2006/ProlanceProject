"""
Customer Neglect Agent
Detects clients whose projects have gone stale, focusing on inactivity, ignored notifications, and user complaints.
"""
import os
import google.generativeai as genai
from schemas import AgentResult, EventContext

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "DUMMY_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload
     
    # Feature Extraction
    days_inactive = int(payload.get("days_inactive", 0))
    unread_notifications = int(payload.get("unread_notifications", 0))
    complaints_count = int(payload.get("complaints_count", 0))
    recent_feedback_text = payload.get("recent_feedback_text", "")

    # Rule Engine for Customer Neglect
    score = 0.0
    
    if days_inactive > 30 and (unread_notifications > 5 or complaints_count > 0):
        score = 85.0
        severity = "HIGH"
    elif days_inactive > 14 or unread_notifications > 2 or complaints_count > 0:
        score = 55.0
        severity = "MEDIUM"
    else:
        score = 15.0
        severity = "LOW"

    # Explanation via LLM
    prompt = f"""
    You are an AI assistant for the TeamLance platform.
    A Rule Engine has analyzed a client's activity and predicted the Customer Neglect risk level as {severity}.
    
    Metrics:
    - Days Inactive: {days_inactive}
    - Unread Notifications: {unread_notifications}
    - User Complaints Count: {complaints_count}
    - Recent Feedback/Complaint Text: "{recent_feedback_text}"
    
    Write a brief, professional summary (1-2 sentences) explaining why this risk level was assigned, 
    and suggest exactly one automated business action we should take (like sending an automated check-in email).
    Do NOT output JSON. Just output plain text.
    """
    
    summary = ""
    try:
        response = model.generate_content(prompt)
        summary = response.text.strip()
    except Exception as e:
        summary = f"Customer Neglect is {severity} due to {days_inactive} days of inactivity."

    return AgentResult(
        agent_name="CustomerNeglectAgent",
        severity=severity,
        score=score,
        summary=summary,
        raw_data={
            "days_inactive": days_inactive,
            "unread_notifications": unread_notifications,
            "complaints_count": complaints_count,
            "recent_feedback_text": recent_feedback_text
        },
    )
