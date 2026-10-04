from dotenv import load_dotenv
import os

load_dotenv('ai-service/.env')
print('KEY IS:', os.getenv('GEMINI_API_KEY'))
