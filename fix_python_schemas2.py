import re

with open('ai-service/schemas.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_freelancer = """class FreelancerProfile(BaseModel):
    id: str
    headline: str
    bio: str
    skills: list[str]"""

new_freelancer = """class FreelancerProfile(BaseModel):
    id: str
    name: Optional[str] = None
    hourly_rate: Optional[float] = 0.0
    headline: str
    bio: str
    skills: list[str]"""

content = content.replace(old_freelancer, new_freelancer)

with open('ai-service/schemas.py', 'w', encoding='utf-8') as f:
    f.write(content)
