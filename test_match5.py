import requests

req = {
    "project_title": "Project 58",
    "project_description": "We need an expert...",
    "project_skills": ["Node.js", "Python"],
    "project_type": "INDIVIDUAL",
    "team_size": 1,
    "freelancers": [
        {"id": "101", "name": "Alice Dev", "hourly_rate": 55.0, "headline": "Expert", "bio": "", "skills": ["Node.js"]},
        {"id": "102", "name": "Bob AI", "hourly_rate": 70.0, "headline": "A", "bio": "", "skills": ["Python"]}
    ]
}

res = requests.post("http://localhost:8001/match", json=req)
print(res.status_code)
print(res.text)
