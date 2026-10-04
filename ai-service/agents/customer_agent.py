"""
Customer Neglect Agent (v2 - Real Per-Client Scoring)
Receives a list of at-risk clients from the real DB scan and scores the neglect severity.
Uses Qwen Local LLM to generate a targeted, human-readable recommendation.
"""
from schemas import AgentResult, EventContext

NEGATIVE_WORDS = ['frustrated', 'disappointed', 'waiting', 'unacceptable', 'ignored', 
                   'terrible', 'awful', 'useless', 'slow', 'angry', 'unhappy', 
                   'elsewhere', 'leaving', 'cancel', 'refund', 'scam']
POSITIVE_WORDS = ['great', 'excellent', 'happy', 'satisfied', 'perfect', 'love',
                   'wonderful', 'fast', 'responsive', 'professional', 'recommend']

def analyze_sentiment(messages: list) -> dict:
    """Keyword-based sentiment analysis (fast, no extra model needed)"""
    if not messages:
        return {'score': 0.5, 'label': 'Neutral', 'negative_count': 0}
    
    all_text = ' '.join(m.lower() for m in messages)
    neg = sum(1 for w in NEGATIVE_WORDS if w in all_text)
    pos = sum(1 for w in POSITIVE_WORDS if w in all_text)
    
    total = neg + pos or 1
    neg_ratio = neg / total
    
    if neg_ratio > 0.6:
        label = 'Frustrated'
        score = 1 - neg_ratio
    elif neg_ratio > 0.3:
        label = 'Concerned'
        score = 0.5
    else:
        label = 'Satisfied'
        score = 0.8
    
    return {'score': round(score, 2), 'label': label, 'negative_count': neg, 'positive_count': pos}


def analyze(ctx: EventContext, pipe=None) -> AgentResult:
    payload = ctx.payload

    inactive_clients_count = int(payload.get("inactive_clients_count", 0))
    critical_count  = int(payload.get("critical_count",  0))
    high_count      = int(payload.get("high_count",      0))
    total_clients   = int(payload.get("total_clients",   1))
    days_inactive   = int(payload.get("days_inactive",   0))
    at_risk_clients = payload.get("at_risk_clients",     [])  
    worst_name      = payload.get("worst_client_name",   "a client")
    worst_days      = payload.get("worst_client_days",   days_inactive)
    worst_risk      = payload.get("worst_client_risk",   "UNKNOWN")

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

    recent_chats = payload.get("recent_chats", [])
    chat_summary = "\n".join([f"> {msg}" for msg in recent_chats[-5:]]) if recent_chats else "No recent chat logs available."

    prompt = f"""
You are an AI business analyst for the ProLance freelance platform.
A real-time customer neglect scan has just completed.

Results:
- Total clients: {total_clients}
- At-risk clients: {inactive_clients_count} ({neglect_pct:.1f}% of total)
- Most at-risk client: "{worst_name}" ({worst_risk} risk, inactive for {worst_days} days)

Recent platform chat logs between clients and freelancers:
{chat_summary}

Based on the chat logs and data above, perform a genuine sentiment analysis.
In 2-3 sentences:
1. Explain why this neglect score is {severity} based on the user sentiment in the chat logs.
2. Suggest ONE specific automated action to fix the issues mentioned in the chat.
3. Predict what happens if no action is taken.

Be direct, professional, and data-driven.
"""

    summary = ""
    if pipe is not None:
        try:
            messages = [
                {"role": "system", "content": "You are a professional data-driven AI analyst. Be concise."},
                {"role": "user", "content": prompt}
            ]
            formatted_prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            outputs = pipe(formatted_prompt, max_new_tokens=150, do_sample=False)
            summary = outputs[0]["generated_text"].split("<|im_start|>assistant\n")[-1].strip()
        except Exception as e:
            print("Local LLM error:", e)

    if not summary:
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
            "at_risk_clients": at_risk_clients[:5],
        },
    )
