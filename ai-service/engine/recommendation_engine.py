"""
Recommendation Engine – uses Groq LLM to generate actionable,
context-aware recommendations for the platform owner.
Falls back to a rule-based template if Groq is unavailable.
"""
import json
import os
from schemas import AgentResult, EventContext, RecommendationResponse

try:
    from groq import Groq
    _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
    _GROQ_AVAILABLE = bool(os.getenv("GROQ_API_KEY"))
except Exception:
    _groq_client = None
    _GROQ_AVAILABLE = False

_SYSTEM_PROMPT = """You are TriGrowth AI, an intelligent business growth advisor for a freelance platform.
Given an agent result and event context, generate a JSON recommendation with these exact keys:
{
  "problem": "One sentence describing the problem",
  "reason": "Why this is happening (root cause)",
  "prediction": "What will happen if no action is taken",
  "recommended_action": "Specific actionable step for the platform owner",
  "expected_improvement": "Quantified expected improvement (e.g. '15% increase in applications')",
  "confidence": 75,
  "automation_plan": [
    {"action_type": "NOTIFY_FREELANCERS", "action_detail": "Notify freelancers with relevant skills"},
    {"action_type": "FEATURE_PROJECT",    "action_detail": "Feature this project on homepage"}
  ]
}
Valid action_types: NOTIFY_FREELANCERS, FEATURE_PROJECT, EMAIL_CLIENT, EMAIL_OWNER_REPORT,
DRAFT_EMAIL_CAMPAIGN, DRAFT_SOCIAL_POST, DRAFT_LANDING_PAGE, DRAFT_RECRUITMENT_EMAIL, SCHEDULE_FOLLOWUP, EMAIL_INACTIVE_USER, OFFER_DISCOUNT.
Return ONLY valid JSON, no markdown fences."""


def _fallback(top_agent: AgentResult, ctx: EventContext) -> RecommendationResponse:
    """Rule-based fallback when Groq is not configured."""
    agent = top_agent.agent_name
    sev   = top_agent.severity

    templates = {
        "CustomerNeglectAgent": {
            "problem": "Multiple users (Clients and/or Freelancers) have been inactive for over 30 days.",
            "reason": "Lack of engagement, or users not finding relevant projects/freelancers.",
            "prediction": "High risk of permanent churn and loss of potential future platform revenue.",
            "recommended_action": "Send a personalized re-engagement campaign with targeted discounts/opportunities.",
            "expected_improvement": "Re-activate 15% of at-risk users within 5 days.",
            "confidence": 80.0,
            "automation_plan": [
                {"action_type": "EMAIL_INACTIVE_USER", "action_detail": "Send automated 'We miss you' re-engagement emails to inactive users"},
                {"action_type": "OFFER_DISCOUNT",      "action_detail": "Offer a 10% platform fee discount to critical risk clients on their next project"},
            ],
        },
        "ProductNeglectAgent": {
            "problem": "A key platform feature has very low adoption.",
            "reason": "Freelancers are unaware of the feature or see no value in using it.",
            "prediction": "Platform differentiation will erode; clients will seek alternatives.",
            "recommended_action": "Run an email campaign highlighting the feature's benefits.",
            "expected_improvement": "Projected 25% adoption increase over 2 weeks.",
            "confidence": 65.0,
            "automation_plan": [
                {"action_type": "DRAFT_EMAIL_CAMPAIGN", "action_detail": "Draft feature promotion email for freelancers"},
                {"action_type": "DRAFT_SOCIAL_POST",    "action_detail": "Draft social media post showcasing the feature"},
            ],
        },
        "FinancialNeglectAgent": {
            "problem": "Monthly revenue is declining and payment collection is delayed.",
            "reason": "Fewer project completions and outstanding payment follow-ups.",
            "prediction": "Cash flow issues will emerge within the next billing cycle.",
            "recommended_action": "Send payment reminders and incentivise project completion.",
            "expected_improvement": "Recover 80% of pending payments within 7 days.",
            "confidence": 78.0,
            "automation_plan": [
                {"action_type": "EMAIL_OWNER_REPORT",   "action_detail": "Send financial risk report to owner"},
                {"action_type": "SCHEDULE_FOLLOWUP",     "action_detail": "Schedule payment follow-up in 3 days"},
            ],
        },
        "OpportunityNeglectAgent": {
            "problem": "High-demand skills are trending on GitHub but underrepresented on the platform.",
            "reason": "Freelancer recruitment has not kept pace with market technology trends.",
            "prediction": "Clients seeking these skills will leave for competing platforms.",
            "recommended_action": "Launch a targeted recruitment campaign for trending technology freelancers.",
            "expected_improvement": "Attract 10+ new expert freelancers within 30 days.",
            "confidence": 68.0,
            "automation_plan": [
                {"action_type": "DRAFT_RECRUITMENT_EMAIL", "action_detail": "Draft recruitment campaign for trending skills"},
                {"action_type": "DRAFT_LANDING_PAGE",       "action_detail": "Draft 'Join as a [skill] Expert' landing page"},
            ],
        },
        "FreelancerNeglectAgent": {
            "problem": "Freelancers are actively ghosting and ignoring direct messages from clients.",
            "reason": "Freelancers may be overbooked, inactive, or not receiving platform notifications.",
            "prediction": "Clients will lose trust in the platform and cancel their projects immediately.",
            "recommended_action": "Send an automated high-priority SMS ping to the offending freelancers.",
            "expected_improvement": "60% of ghosting freelancers will reply within 4 hours of the SMS ping.",
            "confidence": 85.0,
            "automation_plan": [
                {"action_type": "NOTIFY_FREELANCERS", "action_detail": "Send URGENT SMS ping to ghosting freelancers"},
                {"action_type": "EMAIL_CLIENT",        "action_detail": "Send client a 'We are following up' reassurance email"},
            ],
        },
    }

    tpl = templates.get(agent, templates["CustomerNeglectAgent"])
    return RecommendationResponse(**tpl)


def generate(top_agent: AgentResult, ctx: EventContext, pipe=None) -> RecommendationResponse:
    if pipe is None:
        return _fallback(top_agent, ctx)

    prompt = (
        f"Event Type: {ctx.event_type}\n"
        f"Top Agent: {top_agent.agent_name} (Severity: {top_agent.severity})\n"
        f"Agent Summary: {top_agent.summary}\n"
        f"Raw Data Context: {json.dumps(top_agent.raw_data)[:200]}\n\n"
        f"Analyze this data and return exactly the required JSON format. DO NOT INCLUDE MARKDOWN TICK MARKS. ONLY JSON."
    )

    try:
        messages = [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
        formatted_prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        outputs = pipe(formatted_prompt, max_new_tokens=250, do_sample=False)
        content = outputs[0]["generated_text"].split("<|im_start|>assistant\n")[-1].strip()

        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        data = json.loads(content.strip())
        return RecommendationResponse(
            problem=data.get("problem", "Unknown problem"),
            reason=data.get("reason", "Unknown reason"),
            prediction=data.get("prediction", "Unknown prediction"),
            recommended_action=data.get("recommended_action", "No action suggested"),
            expected_improvement=data.get("expected_improvement", "N/A"),
            confidence=float(data.get("confidence", 70.0)),
            automation_plan=data.get("automation_plan", [])
        )
    except Exception as e:
        print(f"[RecommendationEngine] Qwen error: {e}, using fallback.")
        return _fallback(top_agent, ctx)
