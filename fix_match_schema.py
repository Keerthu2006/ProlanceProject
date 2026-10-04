import re

with open('ai-service/schemas.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'class FreelancerProfile\(BaseModel\):\n\s*id: int', 'class FreelancerProfile(BaseModel):\n    id: str', content)
content = re.sub(r'class MatchScore\(BaseModel\):\n\s*freelancer_id: int', 'class MatchScore(BaseModel):\n    freelancer_id: str', content)

with open('ai-service/schemas.py', 'w', encoding='utf-8') as f:
    f.write(content)
