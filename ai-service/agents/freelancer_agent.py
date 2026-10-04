"""
Freelancer Neglect Agent
Analyzes the FREELANCER_GHOSTING_REPORT and outputs recommendations.
"""
import os
from schemas import AgentResult, EventContext

def analyze(ctx: EventContext, pipe=None) -> AgentResult:
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
    summary = ""
    if pipe is not None:
        try:
            messages = [
                {"role": "system", "content": "You are a professional operations analyst. Be concise."},
                {"role": "user", "content": prompt}
            ]
            formatted_prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            outputs = pipe(formatted_prompt, max_new_tokens=150, do_sample=False)
            summary = outputs[0]["generated_text"].split("<|im_start|>assistant\n")[-1].strip()
        except Exception as e:
            print(f"Local LLM error in FreelancerNeglectAgent: {e}")

    if not summary:
        summary = f"Detected {ghosting_count} freelancers ghosting clients. Worst offender inactive for {worst_days} days. Recommend SMS ping."

    return AgentResult(
        agent_name="FreelancerNeglectAgent",
        severity=severity,
        score=score,
        summary=summary,
        raw_data=payload
    )
