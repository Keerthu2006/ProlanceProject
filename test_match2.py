import requests

req = {
    "project_title": "AI Dev",
    "project_description": "Need AI dev",
    "project_skills": ["python", "machine learning"],
    "freelancers": [
        {
            "id": "1",
            "name": "Alice",
            "hourly_rate": 50,
            "skills": ["java"],
            "headline": "Java dev",
            "bio": "I code in java"
        },
        {
            "id": "2",
            "name": "Bob",
            "hourly_rate": 60,
            "skills": ["python"],
            "headline": "Python Expert",
            "bio": "I love machine learning and artificial intelligence."
        }
    ]
}

res = requests.post("http://localhost:8001/match", json=req)
print(res.status_code)
import json
print(json.dumps(res.json(), indent=2))
