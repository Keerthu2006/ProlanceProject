from transformers import pipeline
print("Attempting to load GPT-2...")
try:
    pipe = pipeline("text-generation", model="gpt2")
    print("Success")
except Exception as e:
    print(f"Error: {e}")
