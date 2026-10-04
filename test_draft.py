import requests
req = {
    "action_type": "DRAFT_RECRUITMENT_EMAIL",
    "context": {
        "problem": "test",
        "recommended_action": "test",
        "detail": "test"
    }
}
res = requests.post("http://localhost:8001/draft/content", json=req)
print(res.status_code)
print(res.text)
