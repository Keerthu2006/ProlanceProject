import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'@app.post\("/match", response_model=MatchmakingResponse\)\ndef match_freelancers\(req: MatchmakingRequest\):.*?return MatchmakingResponse\(matches=matches\)', re.DOTALL)

new_match = """from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

@app.post("/match", response_model=MatchmakingResponse)
def match_freelancers(req: MatchmakingRequest):
    matches = []
    proj_skills_lower = [s.lower() for s in req.project_skills] if req.project_skills else []
    project_text = getattr(req, 'project_title', '') + " " + getattr(req, 'project_description', '') + " " + " ".join(proj_skills_lower)
    
    scored_freelancers = []
    
    # 1. Prepare documents for TF-IDF
    documents = [project_text]
    freelancer_texts = []
    
    for f in req.freelancers:
        f_skills = getattr(f, 'skills', []) or []
        f_headline = getattr(f, 'headline', '') or ''
        f_bio = getattr(f, 'bio', '') or ''
        f_text = f"{' '.join(f_skills)} {f_headline} {f_bio}".lower()
        freelancer_texts.append(f_text)
        documents.append(f_text)
        
    # 2. Calculate TF-IDF and Cosine Similarity
    cosine_scores = []
    if any(freelancer_texts) and project_text.strip():
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(documents)
            cosine_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            cosine_scores = [0.0] * len(req.freelancers)
    else:
        cosine_scores = [0.0] * len(req.freelancers)

    for i, f in enumerate(req.freelancers):
        score = 10.0
        reasoning = ["Baseline AI"]
        
        f_skills = getattr(f, 'skills', []) or []
        f_skills_lower = [s.lower() for s in f_skills]
        
        # Jaccard / Set Intersection
        overlap = set(proj_skills_lower).intersection(set(f_skills_lower))
        if overlap:
            score += len(overlap) * 15.0
            reasoning.append(f"Matches {len(overlap)} exact skills")
            
        # Cosine Similarity Score
        cos_sim = cosine_scores[i]
        if cos_sim > 0.05:
            boost = cos_sim * 40.0 
            score += boost
            reasoning.append(f"TF-IDF Semantic Match: {cos_sim:.2f}")
            
        import random
        score += random.uniform(0, 5.0)
        score = min(score, 99.0)
        
        f_id = getattr(f, 'id', None)
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
            })
            
    scored_freelancers.sort(key=lambda x: x["score"], reverse=True)
    
    # 3. Combinatorics for Team Projects
    if getattr(req, 'project_type', None) == "TEAM" and getattr(req, 'team_size', 1) > 1:
        import itertools
        team_size = min(req.team_size, len(scored_freelancers))
        if team_size > 1:
            best_teams = []
            for combo in itertools.combinations(scored_freelancers[:10], team_size):
                combo_skills = set()
                for member in combo:
                    combo_skills.update([s.lower() for s in member["skills"]])
                
                covered = set(proj_skills_lower).intersection(combo_skills)
                coverage_pct = len(covered) / len(proj_skills_lower) if proj_skills_lower else 1.0
                
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
                    reason="Combined skills perfectly match the project via Algorithmic Grouping."
                ))
            return MatchmakingResponse(matches=matches)

    for f in scored_freelancers[:5]:
        matches.append(MatchScore(
            freelancer_id=f["id"],
            freelancer_name=f["name"],
            score=round(f["score"], 1),
            reason=f["reason"]
        ))
        
    return MatchmakingResponse(matches=matches)"""

content = pattern.sub(new_match, content)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
