import subprocess, os
# Fix the Groq model name across all agent files and main.py
# From: llama-3.1-8b-instant (deprecated) -> groq/compound-mini (available)

files = [
    'agents/financial_agent.py',
    'agents/opportunity_agent.py', 
    'agents/product_agent.py',
    'agents/customer_agent.py',
    'agents/freelancer_agent.py',
    'engine/recommendation_engine.py',
    'main.py',
]

for f in files:
    path = f'C:/Users/julie/.gemini/antigravity/scratch/trigrowth-ai/ai-service/{f}'
    try:
        with open(path, 'r', encoding='utf-8') as fp:
            content = fp.read()
        
        # Replace old deprecated model name
        new_content = content.replace('llama-3.1-8b-instant', 'groq/compound-mini')
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as fp:
                fp.write(new_content)
            print(f"  Fixed: {f}")
        else:
            print(f"  No change: {f}")
    except FileNotFoundError:
        print(f"  Not found: {f}")

print("Done!")
