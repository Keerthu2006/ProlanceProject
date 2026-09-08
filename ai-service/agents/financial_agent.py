"""
Financial Neglect Agent – v2
Uses a pre-trained Random Forest model (financial_neglect_rf.pkl) to predict
revenue churn risk from REAL payment data emitted by the Spring Boot backend.
"""
import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from schemas import AgentResult, EventContext

# Load the RF model from the same directory as this file OR one level up
_dir = Path(__file__).parent
_model_paths = [_dir / 'financial_neglect_rf.pkl', _dir.parent / 'financial_neglect_rf.pkl']
rf_model = None
for _p in _model_paths:
    if _p.exists():
        try:
            rf_model = joblib.load(_p)
            print(f"[FinancialAgent] Loaded RF model from: {_p}")
            break
        except Exception as e:
            print(f"[FinancialAgent] Could not load model from {_p}: {e}")

if rf_model is None:
    print("[FinancialAgent] WARNING: RF model not found, using rule-based fallback")


def _groq_summary(severity: str, features: dict) -> str:
    """Try Groq then return a deterministic fallback."""
    try:
        import groq as groq_lib
        client = groq_lib.Groq(api_key=os.getenv("GROQ_API_KEY", ""))
        prompt = (
            f"You are a financial analyst for a freelance platform.\n"
            f"A Random Forest ML model classified Financial Neglect Risk as: {severity}\n"
            f"Key metrics: budget=${features.get('budget',0):.0f}, "
            f"agreed=${features.get('agreed_amount',0):.0f}, "
            f"payment delay={features.get('payment_delay',0):.1f} days, "
            f"overdue milestones={features.get('overdue_milestones',0)}, "
            f"client rating={features.get('client_rating',5):.1f}/5.\n"
            f"Write 2 concise sentences: explain the risk, then suggest one automated action."
        )
        chat = client.chat.completions.create(
            model="groq/compound-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4, max_tokens=120,
        )
        return chat.choices[0].message.content.strip()
    except Exception:
        pass

    delay = features.get('payment_delay', 0)
    overdue = features.get('overdue_milestones', 0)
    revenue_drop = features.get('drop_percentage', 0)

    if severity == "HIGH":
        return (
            f"Critical financial risk detected: payment delayed {delay:.0f} days with "
            f"{overdue} overdue milestone(s) and revenue dropped {revenue_drop:.1f}%. "
            f"Action: Send immediate payment reminder and escalate to owner review."
        )
    elif severity == "MEDIUM":
        return (
            f"Moderate financial risk: {delay:.0f}-day payment delay and {overdue} pending milestone(s) "
            f"signal potential cash-flow issues. "
            f"Action: Schedule automated follow-up with client in 3 days."
        )
    else:
        return (
            f"Financial health is stable — no significant delays or overdue milestones detected. "
            f"Action: Continue monitoring with weekly revenue snapshots."
        )


def analyze(ctx: EventContext) -> AgentResult:
    payload = ctx.payload

    # Support both old REVENUE_REPORT payload shape and new REVENUE_NEGLECT_REPORT shape
    budget             = float(payload.get("budget", payload.get("current_month_revenue", 5000.0)))
    agreed_amount      = float(payload.get("agreed_amount", budget * 0.95))
    budget_utilization = agreed_amount / budget if budget > 0 else 1.0
    payment_delay      = float(payload.get("payment_delay_days", payload.get("payment_delay", 0.0)))
    overdue_milestones = int(payload.get("overdue_milestones", 0))
    client_rating      = float(payload.get("client_rating", 4.5))
    freelancer_rating  = float(payload.get("freelancer_rating", 4.8))
    revenue_drop       = float(payload.get("drop_percentage", 0.0))

    if rf_model is not None:
        features_df = pd.DataFrame([{
            'budget': budget,
            'agreed_amount': agreed_amount,
            'budget_utilization': budget_utilization,
            'payment_delay': payment_delay,
            'overdue_milestones': overdue_milestones,
            'client_rating': client_rating,
            'freelancer_rating': freelancer_rating,
        }])
        prediction = int(rf_model.predict(features_df)[0])
        proba      = rf_model.predict_proba(features_df)[0]
        confidence = float(np.max(proba)) * 100
    else:
        # Rule-based fallback
        if payment_delay > 14 or overdue_milestones > 1 or revenue_drop > 20:
            prediction = 2
        elif payment_delay > 5 or overdue_milestones == 1 or revenue_drop > 10:
            prediction = 1
        else:
            prediction = 0
        confidence = 60.0

    severity_map = {2: ("HIGH", 85.0), 1: ("MEDIUM", 50.0), 0: ("LOW", 15.0)}
    severity, score = severity_map.get(prediction, ("LOW", 15.0))

    feature_dict = {
        "budget": budget, "agreed_amount": agreed_amount,
        "payment_delay": payment_delay, "overdue_milestones": overdue_milestones,
        "client_rating": client_rating, "drop_percentage": revenue_drop,
    }
    summary = _groq_summary(severity, feature_dict)

    return AgentResult(
        agent_name="FinancialNeglectAgent",
        severity=severity,
        score=score,
        summary=summary,
        raw_data={
            "rf_prediction": prediction,
            "rf_confidence": round(confidence, 1),
            "budget": budget,
            "agreed_amount": agreed_amount,
            "payment_delay_days": payment_delay,
            "overdue_milestones": overdue_milestones,
            "revenue_drop_pct": revenue_drop,
            "client_rating": client_rating,
        },
    )
