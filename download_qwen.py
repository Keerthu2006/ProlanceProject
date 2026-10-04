import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

print("Starting download of Qwen2.5-0.5B-Instruct...")
print("This is ~900MB and might take a few minutes depending on your internet speed.")

from transformers import AutoTokenizer, AutoModelForCausalLM

model_id = "Qwen/Qwen2.5-0.5B-Instruct"

print("Downloading Tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_id)

print("Downloading Model Weights...")
model = AutoModelForCausalLM.from_pretrained(model_id)

print("Download Complete! Model is cached and ready.")
