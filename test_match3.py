import requests

req = {
    "project_title": "Project 58",
    "project_description": "We need an expert...",
    "project_skills": ["Node.js", "Python"],
    "freelancers": [
        {
            "id": 101,
            "headline": "Expert in Spring Boot",
            "bio": "",
            "skills": ["Spring Boot"]
        }
    ]
}

res = requests.post("http://localhost:8001/match", json=req)
print(res.status_code)
print(res.text)
