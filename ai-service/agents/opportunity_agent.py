"""
Opportunity Neglect Agent
Fetches live tech trends (e.g., via GitHub API) and compares it against the platform's skill supply.
Uses Google Gemini API to generate learning recommendations and market insights.
"""
import os
import requests
import google.generativeai as genai
from schemas import AgentResult, EventContext

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "DUMMY_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

def fetch_live_trend():
    """
    Fetches the top trending programming language/skill from GitHub API.
    """
    try:
        url = "https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc"
        headers = {"Accept": "application/vnd.github.v3+json"}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            languages = {}
            for item in data.get("items", [])[:15]:
                lang = item.get("language")
                if lang:
                    languages[lang] = languages.get(lang, 0) + 1
            if languages:
                return max(languages, key=languages.get)
    except Exception as e:
        print(f"Failed to fetch trend: {e}")
    
    return "Python"

def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload
    
    trending_skill = fetch_live_trend()
    platform_supply_map = payload.get("platform_skill_supply", {})
    
    supply = 0
    for skill, count in platform_supply_map.items():
        if trending_skill.lower() in str(skill).lower():
            supply += count

    score = 0.0

    if supply < 3:
        score = 85.0
        severity = "HIGH"
    elif supply < 10:
        score = 40.0
        severity = "MEDIUM"
    else:
        score = 10.0
        severity = "LOW"

    prompt = f"""
    You are a Market Intelligence Analyst for a freelancer platform.
    A Rule Engine has identified an Opportunity Neglect risk level of {severity}.
    
    Metrics:
    - Global Trending Technology: '{trending_skill}'
    - Current Platform Freelancers with this skill: {supply}
    
    Write a brief summary (1-2 sentences) of this market opportunity. 
    Then, suggest exactly one automated business action (like recommending an educational course on '{trending_skill}' to freelancers, or running a marketing campaign).
    Do NOT output JSON. Just output plain text.
    """
    
    summary = ""
    try:
        response = model.generate_content(prompt)
        summary = response.text.strip()
    except Exception as e:
        if severity != "LOW":
            summary = f"Opportunity Neglect: '{trending_skill}' is trending globally but only {supply} freelancers have it."
        else:
            summary = f"Platform is well-supplied for trending skill: '{trending_skill}' ({supply} freelancers)."

    return AgentResult(
        agent_name="OpportunityNeglectAgent",
        severity=severity,
        score=score,
        summary=summary,
        raw_data={
            "live_trending_skill": trending_skill,
            "platform_supply": supply,
        },
    )
