import os

filepath = "ai-service/main.py"
content = open(filepath, "r", encoding="utf-8").read()

# 1. Add model loading at the top
import_block = """from engine import decision_engine, recommendation_engine

# --- LOCAL LLM INTEGRATION (Qwen) ---
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

print("====================================================")
print("🚀 BOOTING UP OPEN SOURCE LOCAL LLM (Qwen1.5-0.5B-Chat)...")
print("====================================================")

try:
    model_id = "Qwen/Qwen1.5-0.5B-Chat"
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id, 
        torch_dtype=torch.float32, 
        device_map="cpu"
    )
    pipe = pipeline("text-generation", model=model, tokenizer=tokenizer)
    print("\n[OK] Local LLM Loaded Successfully! API is ready.")
except Exception as e:
    print(f"Failed to load LLM: {e}")
    pipe = None
# ------------------------------------"""

content = content.replace("from engine import decision_engine, recommendation_engine", import_block)

# 2. Rewrite draft_content to use Local LLM
draft_old = """    try:
        import groq as groq_lib
        client = groq_lib.Groq(api_key=os.getenv("GROQ_API_KEY", ""))

        prompt = (
            f"You are a professional business copywriter for a freelance platform called TriGrowth AI.\\n"
            f"Generate a {req.action_type.replace('_', ' ').title()} based on this context:\\n"
            f"{json.dumps(req.context, default=str)[:600]}\\n\\n"
            f"Keep it professional, concise, and actionable. Return only the content text."
        )

        chat = client.chat.completions.create(
            model="groq/compound-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=400,
        )
        content = chat.choices[0].message.content.strip()
    except Exception:"""

draft_new = """    try:
        prompt = (
            f"You are a professional business copywriter for a freelance platform called TriGrowth AI.\\n"
            f"Generate a {req.action_type.replace('_', ' ').title()} based on this context:\\n"
            f"{json.dumps(req.context, default=str)[:600]}\\n\\n"
            f"Keep it professional, concise, and actionable. Return only the content text."
        )

        if pipe is not None:
            messages = [{"role": "user", "content": prompt}]
            formatted = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            outputs = pipe(formatted, max_new_tokens=400, do_sample=True, temperature=0.6)
            content = outputs[0]["generated_text"][len(formatted):].strip()
        else:
            raise Exception("Local LLM not loaded")
    except Exception:"""

content = content.replace(draft_old, draft_new)

# 3. Rewrite chat to use Local LLM
chat_old = """    gemini_key = os.getenv("GEMINI_API_KEY", "")
    groq_key = os.getenv("GROQ_API_KEY", "")

    system_context = (
        f"You are ProLance AI, an intelligent business assistant for the ProLance "
        f"AI-Powered Freelance Intelligence Platform. You are assisting a {req.role}. "
        f"Be concise, helpful, professional, and actionable. "
        f"Focus on freelancing, project management, AI insights, market intelligence, and business growth."
    )

    if gemini_key:"""

chat_new = """    system_context = (
        f"You are ProLance AI, an intelligent business assistant for the ProLance "
        f"AI-Powered Freelance Intelligence Platform. You are assisting a {req.role}. "
        f"Be concise, helpful, professional, and actionable. "
        f"Focus on freelancing, project management, AI insights, market intelligence, and business growth."
    )

    if pipe is not None:
        try:
            messages = [
                {"role": "system", "content": system_context},
                {"role": "user", "content": req.message}
            ]
            formatted = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            outputs = pipe(formatted, max_new_tokens=250, do_sample=True, temperature=0.7)
            reply = outputs[0]["generated_text"][len(formatted):].strip()
            return ChatResponse(response=reply)
        except Exception as e:
            print(f"Chat LLM Error: {e}")
            pass

    gemini_key = os.getenv("GEMINI_API_KEY", "")
    groq_key = os.getenv("GROQ_API_KEY", "")

    if gemini_key:"""

content = content.replace(chat_old, chat_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Successfully patched main.py with Local LLM!")
