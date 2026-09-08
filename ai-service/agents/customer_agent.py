"""
Customer Neglect Agent (v2 - Real Per-Client Scoring)
Receives a list of at-risk clients from the real DB scan and scores the neglect severity.
Uses Gemini LLM to generate a targeted, human-readable recommendation.
"""
import os
import google.generativeai as genai
from schemas import AgentResult, EventContext

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "DUMMY_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')


def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload

    # --- v2: Extract rich per-client data from real scanner ---
    inactive_clients_count = int(payload.get("inactive_clients_count", 0))
    critical_count  = int(payload.get("critical_count",  0))
    high_count      = int(payload.get("high_count",      0))
    total_clients   = int(payload.get("total_clients",   1))
    days_inactive   = int(payload.get("days_inactive",   0))
    at_risk_clients = payload.get("at_risk_clients",     [])  # list of dicts from DB
    worst_name      = payload.get("worst_client_name",   "a client")
    worst_days      = payload.get("worst_client_days",   days_inactive)
    worst_risk      = payload.get("worst_client_risk",   "UNKNOWN")

    # --- Neglect score based on proportion and severity ---
    neglect_pct = (inactive_clients_count / max(1, total_clients)) * 100

    if critical_count > 0 or neglect_pct > 30:
        score    = 85.0
        severity = "CRITICAL"
    elif high_count > 0 or neglect_pct > 15:
        score    = 65.0
        severity = "HIGH"
    elif inactive_clients_count > 0 or neglect_pct > 5:
        score    = 40.0
        severity = "MEDIUM"
    else:
        score    = 10.0
        severity = "LOW"

    # Build at-risk client summary for LLM
    client_summary = ""
    if at_risk_clients:
        top_3 = at_risk_clients[:3]
        lines = [
            f"  - {c.get('client_name','?')} ({c.get('risk','?')} risk, "
            f"{c.get('days_inactive',0)} days inactive, "
            f"{c.get('projects_30d',0)} projects in 30d)"
            for c in top_3
        ]
        client_summary = "\n".join(lines)

    prompt = f"""
You are an AI business analyst for the ProLance freelance platform (like Upwork).
A real-time customer neglect scan has just completed.

Results:
- Total clients: {total_clients}
- At-risk clients: {inactive_clients_count} ({neglect_pct:.1f}% of total)
- CRITICAL risk: {critical_count} clients
- HIGH risk: {high_count} clients
- Most at-risk client: "{worst_name}" ({worst_risk} risk, inactive for {worst_days} days)

Top at-risk clients:
{client_summary if client_summary else "  No at-risk clients detected."}

Severity assessment: {severity}

In 2-3 sentences:
1. Explain why this neglect score is {severity}
2. Suggest ONE specific automated action (e.g., personalized re-engagement email, discount offer, project suggestion)
3. Predict what happens if no action is taken in 30 days

Be direct, professional, and data-driven. No fluff.
"""

    summary = ""
    try:
        response = model.generate_content(prompt)
        summary = response.text.strip()
    except Exception:
        summary = (
            f"Customer Neglect is {severity}: {inactive_clients_count} out of {total_clients} "
            f"clients are at risk ({neglect_pct:.0f}%). "
            f"Most critical: '{worst_name}' inactive for {worst_days} days. "
            f"Recommend immediate re-engagement campaign."
        )

    return AgentResult(
        agent_name="CustomerNeglectAgent",
        severity=severity,
        score=score,
        summary=summary,
        raw_data={
            "inactive_clients_count": inactive_clients_count,
            "critical_count":  critical_count,
            "high_count":      high_count,
            "total_clients":   total_clients,
            "neglect_pct":     round(neglect_pct, 1),
            "worst_client":    worst_name,
            "worst_days":      worst_days,
            "worst_risk":      worst_risk,
            "at_risk_clients": at_risk_clients[:5],  # top 5 for display
        },
    )
