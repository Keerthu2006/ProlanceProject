import requests
import json
import random
from datetime import datetime

BASE_URL = "http://localhost:8080/api"

print("==================================")
print("STARTING DEEP DATA INJECTION")
print("==================================")

# 1. Login as Julie
login_res = requests.post(f"{BASE_URL}/auth/login", json={"email":"client1@example.com", "password":"password"})
if login_res.status_code == 200:
    client_token = login_res.json().get("token")
    client_headers = {"Authorization": f"Bearer {client_token}"}
    print("Logged in as Julie (Client)")
else:
    print("Failed to login as Julie")
    exit(1)

# 2. Login as a Freelancer
login_res2 = requests.post(f"{BASE_URL}/auth/login", json={"email":"freelancer93@example.com", "password":"password"})
freelancer_token = login_res2.json().get("token")
freelancer_headers = {"Authorization": f"Bearer {freelancer_token}"}

# 3. Create realistic projects
projects = [
    {"title": "Redesign React Dashboard", "description": "Need a modern UI overhaul.", "budgetMin": 2000, "budgetMax": 4000, "skillsRequired": ["React", "UI/UX", "Tailwind"]},
    {"title": "Spring Boot API Migration", "description": "Migrating legacy to Spring Boot.", "budgetMin": 5000, "budgetMax": 8000, "skillsRequired": ["Java", "Spring Boot", "SQL"]},
    {"title": "E-commerce Mobile App", "description": "Flutter app for our store.", "budgetMin": 3000, "budgetMax": 6000, "skillsRequired": ["Flutter", "Dart", "Firebase"]}
]

project_ids = []
for p in projects:
    res = requests.post(f"{BASE_URL}/projects", json=p, headers=client_headers)
    if res.status_code in [200, 201]:
        pid = res.json().get("id")
        project_ids.append(pid)
        print(f"Created Project: {p['title']} (ID: {pid})")

# 4. Freelancer Bids & Client Hires
if project_ids:
    pid = project_ids[0]
    # Apply
    requests.post(f"{BASE_URL}/projects/{pid}/apply", json={"coverLetter": "I have 5 years of React experience and can deliver this quickly.", "proposedAmount": 2500}, headers=freelancer_headers)
    print(f"Freelancer 93 applied to Project {pid}")
    
    # Client Hires
    # Get freelancer ID
    f_res = requests.get(f"{BASE_URL}/freelancers")
    f_id = next((f["id"] for f in f_res.json() if f["email"] == "freelancer93@example.com"), None)
    
    if f_id:
        requests.post(f"{BASE_URL}/projects/{pid}/hire/{f_id}", headers=client_headers)
        print(f"Client hired Freelancer {f_id} on Project {pid}")
        
        # 5. Inject realistic Chat Log
        requests.post(f"{BASE_URL}/projects/{pid}/messages", json={"content": "Hi! Thanks for hiring me. When do we start?"}, headers=freelancer_headers)
        requests.post(f"{BASE_URL}/projects/{pid}/messages", json={"content": "I'm still waiting on the Figma files from your team..."}, headers=freelancer_headers)
        requests.post(f"{BASE_URL}/projects/{pid}/messages", json={"content": "This is getting frustrating, it's been 3 days without a response. Please advise."}, headers=freelancer_headers)
        print("Injected frustrated chat log for Sentiment AI testing")

print("==================================")
print("DEEP DATA INJECTION COMPLETE")
print("==================================")
