"""
Financial Neglect Agent
Uses a pre-trained Random Forest model to predict financial risk based on project metrics.
Uses Google Gemini API to generate human-readable explanations and recommendations.
"""
import os
import joblib
import pandas as pd
import google.generativeai as genai
from schemas import AgentResult, EventContext

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "DUMMY_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# Load the Random Forest model
try:
    rf_model = joblib.load('financial_neglect_rf.pkl')
except Exception as e:
    print(f"Warning: Could not load financial ML model: {e}")
    rf_model = None

def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload
    
    budget = float(payload.get("budget", 5000.0))
    agreed_amount = float(payload.get("agreed_amount", budget))
    budget_utilization = agreed_amount / budget if budget > 0 else 1.0
    payment_delay = float(payload.get("payment_delay_days", 0.0))
    overdue_milestones = int(payload.get("overdue_milestones", 0))
    client_rating = float(payload.get("client_rating", 5.0))
    freelancer_rating = float(payload.get("freelancer_rating", 5.0))
    
    if rf_model:
        # Prepare features for ML model
        features = pd.DataFrame([{
            'budget': budget,
            'agreed_amount': agreed_amount,
            'budget_utilization': budget_utilization,
            'payment_delay': payment_delay,
            'overdue_milestones': overdue_milestones,
            'client_rating': client_rating,
            'freelancer_rating': freelancer_rating
        }])
        
        # Predict: 0 = Low, 1 = Medium, 2 = High
        prediction = rf_model.predict(features)[0]
    else:
        # Fallback rules if model fails to load
        if payment_delay > 14 or overdue_milestones > 1:
            prediction = 2
        elif payment_delay > 5 or overdue_milestones == 1:
            prediction = 1
        else:
            prediction = 0
            
    # Map prediction to score and severity
    if prediction == 2:
        severity = "HIGH"
        score = 85.0
    elif prediction == 1:
        severity = "MEDIUM"
        score = 50.0
    else:
        severity = "LOW"
        score = 15.0

    # Use Gemini ONLY for explanation and recommendation
    prompt = f"""
    You are an AI assistant for the TeamLance platform.
    A Machine Learning model has analyzed a project's financial metrics and predicted the Financial Risk level as {severity}.
    
    Metrics:
    - Budget: ${budget}
    - Agreed Amount: ${agreed_amount}
    - Budget Utilization: {budget_utilization:.2f}
    - Payment Delay: {payment_delay} days
    - Overdue Milestones: {overdue_milestones}
    - Client Rating: {client_rating}
    - Freelancer Rating: {freelancer_rating}
    
    Write a brief, professional summary (1-2 sentences) explaining why this risk level was assigned, 
    and suggest exactly one automated business action we should take.
    Do NOT output JSON. Just output plain text.
    """
    
    summary = ""
    try:
        response = model.generate_content(prompt)
        summary = response.text.strip()
    except Exception as e:
        summary = f"Financial risk is {severity} based on payment delay and budget utilization."

    return AgentResult(
        agent_name="FinancialNeglectAgent",
        severity=severity,
        score=score,
        summary=summary,
        raw_data={
            "prediction": int(prediction),
            "budget": budget,
            "agreed_amount": agreed_amount,
            "payment_delay": payment_delay,
            "overdue_milestones": overdue_milestones
        },
    )
