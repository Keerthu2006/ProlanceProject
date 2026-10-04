import os
content = open("deep_data_injector.py", "r", encoding="utf-8").read()
with open("deep_data_injector.py", "w", encoding="utf-8") as f:
    f.write(content)
