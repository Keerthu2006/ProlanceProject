import re

with open('ai-service/schemas.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
"""class MatchmakingRequest(BaseModel):
    project_title: str
    project_description: str
    project_skills: list[str]
    freelancers: list[FreelancerProfile]""",
"""class MatchmakingRequest(BaseModel):
    project_title: str
    project_description: str
    project_skills: list[str]
    project_type: str = "INDIVIDUAL"
    team_size: int = 1
    freelancers: list[FreelancerProfile]"""
)

content = content.replace(
"""class MatchScore(BaseModel):
    freelancer_id: str
    score: float""",
"""from typing import Optional
class MatchScore(BaseModel):
    freelancer_id: str
    freelancer_name: Optional[str] = None
    score: float"""
)

with open('ai-service/schemas.py', 'w', encoding='utf-8') as f:
    f.write(content)
