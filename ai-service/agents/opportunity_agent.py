"""
Opportunity Neglect Agent – v2
Uses GitHub Trending API + simulated SEO keyword volume data to find skill gaps.
Compares trending skills against what freelancers on the platform currently offer.
"""
import os
import requests
from schemas import AgentResult, EventContext

# --------------------------------------------------------------------------
# Simulated SEO Keyword Volume Data (replaces paid SEO API)
# In production this would call Google Trends API, SemRush, or Ahrefs.
# These numbers represent monthly search volume (thousands) on freelance sites.
# --------------------------------------------------------------------------
SEO_TRENDING_SKILLS = {
    "AI Integration":      92_000,
    "LLM Fine-tuning":     78_000,
    "Next.js":             65_000,
    "React Native":        58_000,
    "Cloud DevOps":        54_000,
    "Rust":                42_000,
    "Blockchain/Web3":     38_000,
    "Python":              35_000,
    "Flutter":             32_000,
    "Go (Golang)":         28_000,
    "TypeScript":          26_000,
    "Kubernetes":          24_000,
    "Machine Learning":    22_000,
    "React":               20_000,
    "Node.js":             18_000,
}


def fetch_github_trending_skill() -> str:
    """Fetch top language from GitHub trending repos (last 6 months)."""
    try:
        url = "https://api.github.com/search/repositories?q=created:>2024-06-01&sort=stars&order=desc&per_page=20"
        headers = {"Accept": "application/vnd.github.v3+json"}
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            languages: dict[str, int] = {}
            for item in resp.json().get("items", []):
                lang = item.get("language")
                if lang:
                    languages[lang] = languages.get(lang, 0) + 1
            if languages:
                return max(languages, key=languages.get)
    except Exception as e:
        print(f"[OpportunityAgent] GitHub API failed: {e}")
    return "Python"


def _generate_summary(severity: str, top_skills: list, skill_gaps: list, pipe=None) -> str:
    summary = ""
    if pipe is not None:
        try:
            prompt = (
                f"You are a Market Intelligence Analyst for a freelance platform.\n"
                f"The Opportunity Neglect Risk level is: {severity}\n"
                f"Top globally trending skills (by SEO search volume): {', '.join(top_skills[:3])}\n"
                f"Skills missing from the platform (skill gaps): {', '.join(skill_gaps[:3]) if skill_gaps else 'None detected'}\n"
                f"Write 2 concise sentences: describe the market opportunity gap, then suggest one automated recruitment action."
            )
            messages = [
                {"role": "system", "content": "You are a professional Market Intelligence analyst. Be concise."},
                {"role": "user", "content": prompt}
            ]
            formatted_prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            outputs = pipe(formatted_prompt, max_new_tokens=150, do_sample=False)
            summary = outputs[0]["generated_text"].split("<|im_start|>assistant\n")[-1].strip()
            if summary:
                return summary
        except Exception as e:
            print(f"Local LLM error in OpportunityNeglectAgent: {e}")

    if severity == "HIGH":
        return (
            f"Major opportunity gap: skills like {', '.join(top_skills[:2])} are trending globally "
            f"but severely underrepresented on the platform. "
            f"Action: Launch a targeted LinkedIn recruitment campaign for these skills immediately."
        )
    elif severity == "MEDIUM":
        return (
            f"Moderate opportunity gap: {', '.join(top_skills[:2])} are gaining demand "
            f"but the platform has limited supply. "
            f"Action: Send skill-upgrade recommendations to relevant freelancers."
        )
    else:
        return (
            f"Platform skill supply is well-aligned with current market trends. "
            f"Action: Continue monitoring weekly market trend reports."
        )


def analyze(ctx: EventContext, pipe=None) -> AgentResult:
    payload = ctx.payload

    # Get platform skill supply from backend payload (real data!)
    platform_supply: dict = payload.get("platform_skill_supply", {})

    # Normalize keys to lowercase for matching
    platform_supply_lower = {k.lower(): v for k, v in platform_supply.items()}

    # Get GitHub's trending skill
    github_trend = fetch_github_trending_skill()

    # Calculate gaps: SEO trending skill vs platform supply
    skill_gaps = []
    skill_scores = {}
    total_gap_score = 0.0

    for skill, seo_volume in SEO_TRENDING_SKILLS.items():
        # Check if platform has this skill (fuzzy match)
        skill_lower = skill.lower()
        supply_count = 0
        for platform_skill, count in platform_supply_lower.items():
            if any(word in platform_skill for word in skill_lower.split()[:2]):
                supply_count += count

        # Calculate gap: higher SEO volume + lower supply = bigger gap
        demand_index = seo_volume / 100_000  # normalize to 0-1
        supply_ratio = min(supply_count / 10, 1.0)  # 10+ freelancers = well covered
        gap = demand_index * (1 - supply_ratio)
        skill_scores[skill] = gap

        if supply_count < 3 and seo_volume > 30_000:
            skill_gaps.append(skill)

        total_gap_score += gap

    top_seo_skills = sorted(SEO_TRENDING_SKILLS, key=SEO_TRENDING_SKILLS.get, reverse=True)[:5]

    # Normalize score to 0-100
    normalized_score = min(total_gap_score * 100, 100.0)

    if normalized_score > 60 or len(skill_gaps) > 5:
        severity = "HIGH"
        score = max(normalized_score, 75.0)
    elif normalized_score > 30 or len(skill_gaps) > 2:
        severity = "MEDIUM"
        score = max(normalized_score, 45.0)
    else:
        severity = "LOW"
        score = normalized_score

    summary = _generate_summary(severity, top_seo_skills, skill_gaps, pipe=pipe)

    return AgentResult(
        agent_name="OpportunityNeglectAgent",
        severity=severity,
        score=round(score, 2),
        summary=summary,
        raw_data={
            "github_trending_skill": github_trend,
            "top_seo_trending_skills": top_seo_skills,
            "platform_skill_supply": platform_supply,
            "detected_skill_gaps": skill_gaps[:5],
            "total_gap_score": round(total_gap_score, 3),
        },
    )
