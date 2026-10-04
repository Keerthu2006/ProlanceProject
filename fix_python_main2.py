import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
"""        f_id = getattr(f, 'id', None)
        if f_id is not None:
            scored_freelancers.append({
                "id": str(f_id),
                "name": f"Freelancer #{str(f_id)[:8]}",
                "score": score,
                "skills": f_skills,
                "reason": " - ".join(reasoning)
            })""",
"""        f_id = getattr(f, 'id', None)
        if f_id is not None:
            f_name = getattr(f, 'name', None) or f"Freelancer #{str(f_id)[:8]}"
            f_rate = getattr(f, 'hourly_rate', 0.0)
            display_name = f"{f_name} (${f_rate}/hr)" if f_rate else f_name
            
            scored_freelancers.append({
                "id": str(f_id),
                "name": display_name,
                "score": score,
                "skills": f_skills,
                "reason": " - ".join(reasoning)
            })"""
)

content = content.replace(
"""    # Individual Matching
    for f in scored_freelancers[:5]:
        matches.append(MatchScore(
            freelancer_id=f["id"],
            freelancer_name=None,
            score=round(f["score"], 1),
            reason=f["reason"]
        ))""",
"""    # Individual Matching
    for f in scored_freelancers[:5]:
        matches.append(MatchScore(
            freelancer_id=f["id"],
            freelancer_name=f["name"],
            score=round(f["score"], 1),
            reason=f["reason"]
        ))"""
)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
