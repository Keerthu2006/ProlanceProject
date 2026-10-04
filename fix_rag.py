with open("ai-service/main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Find the retrieve_rag_context and chat functions and replace them
old_rag_and_chat = """def retrieve_rag_context(user_query: str) -> str:
    query = user_query.lower()
    live_data = ""
    try:
        import requests
        if "freelancer" in query or "talent" in query or "skills" in query or "who" in query:
            res = requests.get("http://localhost:8080/api/freelancers", timeout=3)
            if res.status_code == 200:
                freelancers = res.json()
                live_data += "\\n[LIVE DATABASE - FREELANCERS]\\n"
                for i, f in enumerate(freelancers[:5]):
                    skills = ", ".join(f.get("skills", []))
                    name = f.get("user", {}).get("fullName", "Unknown")
                    live_data += f"- {name}: {f.get('headline', '')} | Skills: {skills} | Rate: ${f.get('hourlyRate', 0)}/hr\\n"
                    
        if "project" in query or "job" in query or "work" in query:
            res = requests.get("http://localhost:8080/api/projects/open", timeout=3)
            if res.status_code == 200:
                projects = res.json()
                live_data += "\\n[LIVE DATABASE - OPEN PROJECTS]\\n"
                for i, p in enumerate(projects[:5]):
                    skills = ", ".join(p.get("skillsRequired", []))
                    live_data += f"- '{p.get('title')}' by {p.get('clientName')} | Budget: ${p.get('budgetMin')}-${p.get('budgetMax')} | Skills: {skills}\\n"
    except Exception as e:
        print("Failed to fetch live data:", e)
        
    if not live_data:
        live_data = "No specific live database records queried. ProLance is an AI Neglect-free platform."
    return live_data"""

new_rag_and_chat = """def retrieve_rag_context(user_query: str, dashboard_context: str = "") -> str:
    query = user_query.lower()
    live_data = ""
    
    # If dashboard_context already contains the user's own projects, do NOT
    # override with platform-wide open projects — it confuses the LLM.
    has_client_projects = "Client's Active Projects:" in dashboard_context
    
    try:
        import requests
        if "freelancer" in query or "talent" in query or "skills" in query or "who" in query:
            res = requests.get("http://localhost:8080/api/freelancers", timeout=3)
            if res.status_code == 200:
                freelancers = res.json()
                live_data += "\\n[LIVE DATABASE - FREELANCERS]\\n"
                for i, f in enumerate(freelancers[:5]):
                    skills = ", ".join(f.get("skills", []))
                    name = f.get("user", {}).get("fullName", "Unknown")
                    live_data += f"- {name}: {f.get('headline', '')} | Skills: {skills} | Rate: ${f.get('hourlyRate', 0)}/hr\\n"

        # Only fetch open projects from DB if we don't already have the user's own projects
        if not has_client_projects and ("project" in query or "job" in query or "work" in query):
            res = requests.get("http://localhost:8080/api/projects/open", timeout=3)
            if res.status_code == 200:
                projects = res.json()
                live_data += "\\n[LIVE DATABASE - OPEN PROJECTS]\\n"
                for i, p in enumerate(projects[:5]):
                    skills = ", ".join(p.get("skillsRequired", []))
                    live_data += f"- '{p.get('title')}' by {p.get('clientName')} | Budget: ${p.get('budgetMin')}-${p.get('budgetMax')} | Skills: {skills}\\n"

    except Exception as e:
        print("Failed to fetch live data:", e)
        
    if not live_data:
        live_data = "No additional live database records needed."
    return live_data"""

content = content.replace(old_rag_and_chat, new_rag_and_chat)

# Also update the call inside the chat function to pass dashboard_context
old_call = "rag_context = retrieve_rag_context(req.message)"
new_call = "rag_context = retrieve_rag_context(req.message, req.dashboard_context)"

content = content.replace(old_call, new_call)

with open("ai-service/main.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
