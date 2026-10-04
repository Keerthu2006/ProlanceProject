import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_match = """@app.post("/match", response_model=MatchmakingResponse)
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
            reasoning.append("Profile text matches requirements")
            
        scored_freelancers.append((f, score, reasoning))
        
    scored_freelancers.sort(key=lambda x: x[1], reverse=True)"""

new_match = """from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

@app.post("/match", response_model=MatchmakingResponse)
def match_freelancers(req: MatchmakingRequest):
    matches = []
    proj_skills_lower = [s.lower() for s in req.project_skills] if req.project_skills else []
    project_text = " ".join(proj_skills_lower)
    
    scored_freelancers = []
    
    # Prepare documents for TF-IDF
    documents = [project_text]
    freelancer_texts = []
    
    for f in req.freelancers:
        f_skills = getattr(f, 'skills', []) or []
        f_headline = getattr(f, 'headline', '') or ''
        f_bio = getattr(f, 'bio', '') or ''
        # Combine all features into a single document representing the freelancer
        f_text = f"{' '.join(f_skills)} {f_headline} {f_bio}".lower()
        freelancer_texts.append(f_text)
        documents.append(f_text)
        
    # Calculate TF-IDF and Cosine Similarity if there's any text
    cosine_scores = []
    if any(freelancer_texts) and project_text.strip():
        try:
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform(documents)
            # Compare project (index 0) against all freelancers (index 1 to N)
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
        
        # 1. Exact Skill Overlap (Set Theory)
        overlap = set(proj_skills_lower).intersection(set(f_skills_lower))
        if overlap:
            score += len(overlap) * 20.0
            reasoning.append(f"Matches {len(overlap)} exact skills")
            
        # 2. TF-IDF & Cosine Similarity Score
        cos_sim = cosine_scores[i]
        if cos_sim > 0.0:
            # Scale cosine similarity (0-1) up to a score boost
            boost = cos_sim * 40.0 
            score += boost
            reasoning.append(f"TF-IDF Semantic Match: {cos_sim:.2f}")
            
        scored_freelancers.append((f, score, reasoning))
        
    scored_freelancers.sort(key=lambda x: x[1], reverse=True)"""

content = content.replace(old_match, new_match)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
