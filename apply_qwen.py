import re

with open('ai-service/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

header = '''import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

import threading
from transformers import AutoTokenizer, AutoModelForCausalLM

qwen_model = None
qwen_tokenizer = None
model_loading = False

def load_qwen_model():
    global qwen_model, qwen_tokenizer, model_loading
    model_loading = True
    try:
        print("Loading Qwen 2.5 (0.5B) into RAM...")
        model_id = "Qwen/Qwen2.5-0.5B-Instruct"
        qwen_tokenizer = AutoTokenizer.from_pretrained(model_id)
        qwen_model = AutoModelForCausalLM.from_pretrained(model_id)
        print("Qwen 2.5 loaded successfully!")
    except Exception as e:
        print("Error loading Qwen:", e)
    model_loading = False

threading.Thread(target=load_qwen_model, daemon=True).start()
'''

new_chat = '''@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        rag_context = retrieve_rag_context(req.message)
        
        if model_loading:
            return ChatResponse(response="[System] The AI model is currently loading into RAM (this takes about 20 seconds). Please try again in a moment.\\n\\nRAG Context Found: " + rag_context.replace("RAG Context: ", ""))
            
        if qwen_model is None or qwen_tokenizer is None:
            return ChatResponse(response="[System] AI model failed to load.\\n\\nRAG Context: " + rag_context)
            
        messages = [
            {"role": "system", "content": "You are ProLance AI, an intelligent platform assistant. Use the provided RAG Context to answer the user's question accurately. Be concise and professional."},
            {"role": "user", "content": "RAG Context: " + rag_context + "\\n\\nUser Question: " + req.message}
        ]
        
        text = qwen_tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        model_inputs = qwen_tokenizer([text], return_tensors="pt")
        
        generated_ids = qwen_model.generate(
            **model_inputs,
            max_new_tokens=150,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            pad_token_id=qwen_tokenizer.eos_token_id
        )
        
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]
        
        reply = qwen_tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
        
    except Exception as e:
        reply = "I apologize, my local AI encountered an error: " + str(e)
        
    return ChatResponse(response=reply)'''

# Insert header after imports
if "import threading" not in content:
    content = content.replace('from engine import decision_engine, recommendation_engine', 'from engine import decision_engine, recommendation_engine\n\n' + header)

# Replace chat endpoint
old_chat = re.search(r'@app\.post\("/chat", response_model=ChatResponse\).*?return ChatResponse\(response=reply\)', content, flags=re.DOTALL).group(0)
content = content.replace(old_chat, new_chat)

with open('ai-service/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
