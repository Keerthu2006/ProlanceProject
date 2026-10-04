import os

filepath = "ai-service/main.py"
content = open(filepath, "r", encoding="utf-8").read()

old_context = """    system_context = (
        f"You are ProLance AI, an intelligent business assistant for the ProLance "
        f"AI-Powered Freelance Intelligence Platform. You are assisting a {req.role}. "
        f"Be concise, helpful, professional, and actionable. "
        f"Focus on freelancing, project management, AI insights, market intelligence, and business growth."
    )"""

new_context = """    system_context = (
        f"You are ProLance AI, an intelligent business assistant for the ProLance "
        f"AI-Powered Freelance Intelligence Platform. You are assisting a {req.role}. "
        f"Be concise, helpful, professional, and actionable.\\n"
        f"CRITICAL FACTS:\\n"
        f"- ProLance stands for 'Professional Freelance'.\\n"
        f"- The platform connects top-tier clients with expert freelancers.\\n"
        f"- Do NOT invent founders, dates, or company history. If asked about the origins, explain that ProLance is an innovative AI platform built to revolutionize the freelance marketplace.\\n"
        f"- Focus on freelancing, project management, AI insights, market intelligence, and business growth."
    )"""

content = content.replace(old_context, new_context)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated system prompt successfully.")
