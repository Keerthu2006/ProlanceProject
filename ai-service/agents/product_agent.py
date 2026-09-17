"""
Product Neglect Agent – v3
Analyzes three core pillars:
1. Website Feature Adoption (usage rates across key features, adoption deficit)
2. Freelancer Incomplete Profiles (missing bios, skills, hourly rates, avatars)
3. Lack of Transparency (missing GitHub/LinkedIn/portfolio links, unverified deliverables)
Generates unified Product Neglect Score (0-100) and actionable remediation strategies.
"""
import os
from schemas import AgentResult, EventContext


def _generate_summary(severity: str, feature_key: str, feature_adoption_pct: float,
                      incomplete_profile_pct: float, transparency_deficit_pct: float,
                      complaints: int, reviews: list) -> str:
    try:
        import groq as groq_lib
        client = groq_lib.Groq(api_key=os.getenv("GROQ_API_KEY", ""))
        reviews_text = "; ".join(reviews[:3]) if reviews else "No recent reviews"
        prompt = (
            f"You are a Product Operations & UX Intelligence specialist for ProLance, a freelance platform.\n"
            f"Product Neglect Status: {severity}\n"
            f"- Website Feature Adoption: {feature_adoption_pct:.1f}% (Key focus: {feature_key})\n"
            f"- Incomplete Freelancer Profiles: {incomplete_profile_pct:.1f}%\n"
            f"- Lack of Transparency Index: {transparency_deficit_pct:.1f}%\n"
            f"- Recent user complaints: {complaints} ({reviews_text})\n"
            f"Write 2 concise, executive sentences: identify the top product neglect bottleneck, then provide one high-impact automated fix."
        )
        chat = client.chat.completions.create(
            model="groq/compound-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4, max_tokens=140,
        )
        return chat.choices[0].message.content.strip()
    except Exception:
        pass

    if severity in ("CRITICAL", "HIGH"):
        return (
            f"High product neglect detected: {incomplete_profile_pct:.0f}% of freelancer profiles are incomplete, "
            f"feature adoption is lagging at {feature_adoption_pct:.0f}%, and lack of transparency is {transparency_deficit_pct:.0f}%. "
            f"Action: Trigger automated profile completion nudges and deploy interactive onboarding tours for low-adoption features."
        )
    elif severity == "MEDIUM":
        return (
            f"Moderate product neglect: Incomplete profiles ({incomplete_profile_pct:.0f}%) and transparency gaps ({transparency_deficit_pct:.0f}%) "
            f"are causing platform friction despite moderate {feature_adoption_pct:.0f}% feature adoption. "
            f"Action: Enable profile completion incentives and highlight social proof links."
        )
    else:
        return (
            f"Product health is strong: Feature adoption is at {feature_adoption_pct:.0f}%, profiles are well-completed ({100-incomplete_profile_pct:.0f}% complete), "
            f"and transparency verification remains high. Continue continuous feature monitoring."
        )


def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload

    feature_key          = payload.get("feature_key", "team_formation")
    adoption_rate        = float(payload.get("adoption_rate", 0.0))
    feature_usage_count  = int(payload.get("feature_usage_count", 0))
    total_freelancers    = int(payload.get("total_freelancers", 1))
    recent_reviews       = payload.get("recent_reviews", [])

    # Freelancer profile & transparency metrics (if provided from backend scan)
    incomplete_profile_pct    = float(payload.get("incomplete_profile_pct", 35.0))
    transparency_deficit_pct  = float(payload.get("transparency_deficit_pct", 40.0))
    avg_feature_adoption_pct  = float(payload.get("avg_feature_adoption_pct", adoption_rate * 100 if adoption_rate > 0 else 45.0))

    # Recalculate adoption_rate from raw counts if present
    if total_freelancers > 0 and feature_usage_count > 0:
        adoption_rate = feature_usage_count / max(total_freelancers, 1)

    # Feature adoption deficit: how far feature adoption is below 100%
    feature_adoption_pct = avg_feature_adoption_pct
    feature_deficit_pct = max(0.0, 100.0 - feature_adoption_pct)

    # Count negative feedback signals in reviews
    negative_keywords = [
        "hard", "difficult", "confusing", "broken", "didn't work",
        "couldn't find", "no idea", "hidden", "not intuitive", "bug", "incomplete", "unverified"
    ]
    complaint_count = sum(
        1 for r in recent_reviews
        if any(kw in str(r).lower() for kw in negative_keywords)
    )

    # Unified 3-Pillar Product Neglect Score (0 - 100):
    # Pillar 1: Feature Adoption Deficit (Weight 0.40)
    # Pillar 2: Incomplete Profiles (Weight 0.35)
    # Pillar 3: Lack of Transparency (Weight 0.25)
    product_neglect_score = (
        (0.40 * feature_deficit_pct) +
        (0.35 * incomplete_profile_pct) +
        (0.25 * transparency_deficit_pct)
    )

    if complaint_count > 0:
        product_neglect_score += min(complaint_count * 3.0, 10.0)

    product_neglect_score = max(0.0, min(100.0, round(product_neglect_score, 1)))

    if product_neglect_score >= 65:
        severity = "HIGH"
    elif product_neglect_score >= 40:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    summary = _generate_summary(
        severity, feature_key, feature_adoption_pct,
        incomplete_profile_pct, transparency_deficit_pct,
        complaint_count, recent_reviews
    )

    return AgentResult(
        agent_name="ProductNeglectAgent",
        severity=severity,
        score=product_neglect_score,
        summary=summary,
        raw_data={
            "product_neglect_score": product_neglect_score,
            "feature_key": feature_key,
            "feature_adoption_pct": round(feature_adoption_pct, 1),
            "feature_deficit_pct": round(feature_deficit_pct, 1),
            "incomplete_profile_pct": round(incomplete_profile_pct, 1),
            "transparency_deficit_pct": round(transparency_deficit_pct, 1),
            "feature_usage_count": feature_usage_count,
            "total_freelancers": total_freelancers,
            "negative_review_count": complaint_count,
        },
    )
