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
DRAFT_EMAIL_CAMPAIGN, DRAFT_SOCIAL_POST, DRAFT_LANDING_PAGE, DRAFT_RECRUITMENT_EMAIL, SCHEDULE_FOLLOWUP.
Return ONLY valid JSON, no markdown fences."""


def _fallback(top_agent: AgentResult, ctx: EventContext) -> RecommendationResponse:
    """Rule-based fallback when Groq is not configured."""
    agent = top_agent.agent_name
    sev   = top_agent.severity

    templates = {
        "CustomerNeglectAgent": {
            "problem": "A client project has no applications and the client may churn.",
            "reason": "Low platform visibility or skill supply mismatch for this project.",
            "prediction": "Client will abandon the platform within 48 hours if not engaged.",
            "recommended_action": "Feature the project and notify matching freelancers immediately.",
            "expected_improvement": "70% chance of receiving first application within 6 hours.",
            "confidence": 72.0,
            "automation_plan": [
                {"action_type": "NOTIFY_FREELANCERS", "action_detail": "Notify freelancers matching required skills"},
                {"action_type": "FEATURE_PROJECT",    "action_detail": "Feature project on homepage for 48h"},
                {"action_type": "EMAIL_CLIENT",        "action_detail": "Send reassurance email to client"},
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
    }

    tpl = templates.get(agent, templates["CustomerNeglectAgent"])
    return RecommendationResponse(**tpl)


def generate(top_agent: AgentResult, ctx: EventContext) -> RecommendationResponse:
    if not _GROQ_AVAILABLE or _groq_client is None:
        return _fallback(top_agent, ctx)

    user_prompt = (
        f"Agent: {top_agent.agent_name}\n"
        f"Severity: {top_agent.severity}\n"
        f"Score: {top_agent.score}\n"
        f"Summary: {top_agent.summary}\n"
        f"Event type: {ctx.event_type}\n"
        f"Context payload: {json.dumps(ctx.payload, default=str)[:800]}"
    )

    try:
        chat = _groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=800,
        )
        raw = chat.choices[0].message.content.strip()
        data = json.loads(raw)
        return RecommendationResponse(**data)
    except Exception as e:
        print(f"[RecommendationEngine] Groq error ({e}), using fallback.")
        return _fallback(top_agent, ctx)
