"""
Product Neglect Agent – v2
Uses real FeatureUsageLog adoption rates + user review/feedback data from backend.
Analyzes feature adoption, complaint signals, and user awareness gaps.
"""
import os
from schemas import AgentResult, EventContext


def _groq_summary(severity: str, feature_key: str, adoption_rate: float,
                  complaints: int, reviews: list, unaware: bool) -> str:
    try:
        import groq as groq_lib
        client = groq_lib.Groq(api_key=os.getenv("GROQ_API_KEY", ""))
        reviews_text = "; ".join(reviews[:3]) if reviews else "No recent reviews"
        prompt = (
            f"You are a UX Product Researcher analyzing a freelance platform.\n"
            f"Feature '{feature_key}' has Product Neglect Risk: {severity}\n"
            f"Adoption rate: {adoption_rate*100:.1f}%, Complaints: {complaints}, "
            f"Users unaware: {unaware}\n"
            f"Recent user feedback: {reviews_text}\n"
            f"Write 2 concise sentences: explain the UX problem, then suggest one automated fix."
        )
        chat = client.chat.completions.create(
            model="groq/compound-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4, max_tokens=130,
        )
        return chat.choices[0].message.content.strip()
    except Exception:
        pass

    pct = adoption_rate * 100
    if severity == "HIGH":
        return (
            f"Critical product neglect: '{feature_key}' has only {pct:.0f}% adoption with "
            f"{complaints} complaints — users appear completely unaware of its value. "
            f"Action: Send an automated onboarding walkthrough email to all users who have never used this feature."
        )
    elif severity == "MEDIUM":
        return (
            f"Moderate neglect: '{feature_key}' is under-utilised at {pct:.0f}% adoption "
            f"with {complaints} complaints suggesting UX friction. "
            f"Action: Add an in-app tooltip and notification to highlight this feature."
        )
    else:
        return (
            f"'{feature_key}' adoption is healthy at {pct:.0f}% with minimal complaints. "
            f"Action: Continue standard usage monitoring and add success stories to the blog."
        )


def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload

    feature_key          = payload.get("feature_key", "team_formation")
    adoption_rate        = float(payload.get("adoption_rate", 0.0))
    feature_usage_count  = int(payload.get("feature_usage_count", 0))
    total_freelancers    = int(payload.get("total_freelancers", 1))
    recent_reviews       = payload.get("recent_reviews", [])
    bid_adoption_rate    = float(payload.get("bid_adoption_rate", 1.0))

    # Recalculate adoption_rate from raw counts if present
    if total_freelancers > 0 and feature_usage_count >= 0:
        adoption_rate = feature_usage_count / max(total_freelancers, 1)

    # Count negative feedback signals in reviews
    negative_keywords = [
        "hard", "difficult", "confusing", "broken", "didn't work",
        "couldn't find", "no idea", "hidden", "not intuitive", "bug"
    ]
    complaint_count = sum(
        1 for r in recent_reviews
        if any(kw in str(r).lower() for kw in negative_keywords)
    )
    unaware = adoption_rate < 0.15 or any(
        kw in str(recent_reviews).lower()
        for kw in ["didn't know", "unaware", "hidden", "couldn't find", "no idea"]
    )

    # Scoring
    score = 0.0
    if adoption_rate < 0.05:
        score += 50
    elif adoption_rate < 0.15:
        score += 30
    elif adoption_rate < 0.30:
        score += 15

    if unaware:
        score += 25
    if complaint_count > 0:
        score += min(complaint_count * 8, 25)
    if bid_adoption_rate < 0.5 and feature_key == "team_formation":
        score += 10  # freelancers aren't even bidding, product engagement is low

    score = min(score, 100.0)

    if score >= 70:
        severity = "HIGH"
    elif score >= 40:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    summary = _groq_summary(
        severity, feature_key, adoption_rate,
        complaint_count, recent_reviews, unaware
    )

    return AgentResult(
        agent_name="ProductNeglectAgent",
        severity=severity,
        score=round(score, 2),
        summary=summary,
        raw_data={
            "feature_key": feature_key,
            "adoption_rate_pct": round(adoption_rate * 100, 1),
            "feature_usage_count": feature_usage_count,
            "total_freelancers": total_freelancers,
            "negative_review_count": complaint_count,
            "users_appear_unaware": unaware,
        },
    )
