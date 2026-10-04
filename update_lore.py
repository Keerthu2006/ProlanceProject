import os

filepath = "ai-service/main.py"
content = open(filepath, "r", encoding="utf-8").read()

old_string = "- ProLance stands for 'Professional Freelance'."
new_string = "- The 'Pro' in ProLance stands for the PROACTIVE nature of the website, which actively finds the best freelancers using our AI skill score."

content = content.replace(old_string, new_string)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated lore successfully.")
