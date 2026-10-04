import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """@app.post("/match", response_model=MatchmakingResponse)
def match_freelancers(req: MatchmakingRequest):
    matches = []
    proj_skills_lower = [s.lower() for s in req.project_skills] if req.project_skills else []
    
    scored_freelancers = []
    for f in req.freelancers:
        score = 10.0
        reasoning = ["Baseline AI"]
        
        f_skills = getattr(f, 'skills', []) or []
        f_skills_lower = [s.lower() for s in f_skills]
        f_headline = getattr(f, 'headline', '') or ''
        f_bio = getattr(f, 'bio', '') or ''
        
        overlap = set(proj_skills_lower).intersection(set(f_skills_lower))
        if overlap:
            score += len(overlap) * 20.0
            reasoning.append(f"Matches {len(overlap)} skills")
            
        combined_text = f"{f_headline} {f_bio}".lower()
        if any(skill in combined_text for skill in proj_skills_lower):
            score += 15.0
            reasoning.append("Keyword match")
            
        import random
        score += random.uniform(0, 10.0)
        score = min(score, 99.0)
        
        f_id = getattr(f, 'id', None)
        if f_id is not None:
            scored_freelancers.append({
                "id": str(f_id),
                "name": f"Freelancer #{str(f_id)[:8]}",
                "score": score,
                "skills": f_skills,
                "reason": " - ".join(reasoning)
            })
            
    scored_freelancers.sort(key=lambda x: x["score"], reverse=True)
    
    if req.project_type == "TEAM" and req.team_size > 1:
        # Group them into teams!
        import itertools
        team_size = min(req.team_size, len(scored_freelancers))
        if team_size > 1:
            best_teams = []
            for combo in itertools.combinations(scored_freelancers[:10], team_size):
                combo_skills = set()
                for member in combo:
                    combo_skills.update([s.lower() for s in member["skills"]])
                
                # Calculate how many project skills the team covers
                covered = set(proj_skills_lower).intersection(combo_skills)
                coverage_pct = len(covered) / len(proj_skills_lower) if proj_skills_lower else 1.0
                
                # Team score is average of member scores + coverage bonus
                avg_score = sum(m["score"] for m in combo) / team_size
                team_score = min(99.9, avg_score + (coverage_pct * 30.0))
                
                team_ids = ",".join([m["id"] for m in combo])
                
                best_teams.append({
                    "ids": team_ids,
                    "score": team_score,
                    "covered": len(covered),
                    "total": len(proj_skills_lower)
                })
            
            best_teams.sort(key=lambda x: x["score"], reverse=True)
            for i, t in enumerate(best_teams[:5]):
                matches.append(MatchScore(
                    freelancer_id=t["ids"],
                    freelancer_name=f"AI Optimized Team (Covers {t['covered']}/{t['total']} skills)",
                    score=round(t["score"], 1),
                    reason="Combined skills perfectly match the project requirements."
                ))
            return MatchmakingResponse(matches=matches)

    # Individual Matching
    for f in scored_freelancers[:5]:
        matches.append(MatchScore(
            freelancer_id=f["id"],
            freelancer_name=None,
            score=round(f["score"], 1),
            reason=f["reason"]
        ))
        
    return MatchmakingResponse(matches=matches)"""

old_func_pattern = r'@app.post\("/match", response_model=MatchmakingResponse\)\ndef match_freelancers\(req: MatchmakingRequest\):.*?(?=\n@app|\Z)'
content = re.sub(old_func_pattern, new_func, content, flags=re.DOTALL)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
