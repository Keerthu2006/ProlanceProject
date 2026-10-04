import requests

query = "who are the top 3 freelancers on the platform?"
live_data = ""

try:
    if "freelancer" in query or "talent" in query or "skills" in query or "who" in query:
        res = requests.get("http://localhost:8080/api/freelancers", timeout=3)
        if res.status_code == 200:
            freelancers = res.json()
            live_data += "\\n[LIVE DATABASE - FREELANCERS]\\n"
            for i, f in enumerate(freelancers[:15]):
                skills = ", ".join(f.get("skills", []))
                name = f.get("user", {}).get("fullName", "Unknown")
                live_data += f"- {name}: {f.get('headline', '')} | Skills: {skills} | Rate: ${f.get('hourlyRate', 0)}/hr\\n"
except Exception as e:
    print("Error:", e)

print("RAG Context:", live_data)
