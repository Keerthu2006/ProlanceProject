import requests

req = {
    "project_title": "Project 58",
    "project_description": "We need an expert...",
    "project_skills": ["Node.js", "Python"],
    "project_type": "TEAM",
    "team_size": 2,
    "freelancers": [
        {"id": "101", "headline": "A", "bio": "", "skills": ["Node.js"]},
        {"id": "102", "headline": "B", "bio": "", "skills": ["Python"]}
    ]
}

res = requests.post("http://localhost:8001/match", json=req)
print(res.status_code)
print(res.text)
