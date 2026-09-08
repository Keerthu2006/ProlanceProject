import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

print("Generating synthetic financial data...")
np.random.seed(42)

n_samples = 1000

budget = np.random.uniform(500, 10000, n_samples)
agreed_amount = budget * np.random.uniform(0.5, 1.2, n_samples)
budget_utilization = agreed_amount / budget

payment_delay = np.random.exponential(scale=5, size=n_samples) 
overdue_milestones = np.random.poisson(lam=0.5, size=n_samples)

client_rating = np.clip(np.random.normal(4.5, 0.8, n_samples), 1, 5)
freelancer_rating = np.clip(np.random.normal(4.7, 0.5, n_samples), 1, 5)

risk = np.zeros(n_samples)

for i in range(n_samples):
    score = 0
    if payment_delay[i] > 14: score += 2
    elif payment_delay[i] > 5: score += 1
    
    if overdue_milestones[i] > 1: score += 2
    elif overdue_milestones[i] == 1: score += 1
        
    if budget_utilization[i] < 0.7: score += 1
    
    if client_rating[i] < 3.0: score += 1
    
    if score >= 3:
        risk[i] = 2
    elif score >= 1:
        risk[i] = 1
    else:
        risk[i] = 0

df = pd.DataFrame({
    'budget': budget,
    'agreed_amount': agreed_amount,
    'budget_utilization': budget_utilization,
    'payment_delay': payment_delay,
    'overdue_milestones': overdue_milestones,
    'client_rating': client_rating,
    'freelancer_rating': freelancer_rating,
    'risk_level': risk
})

X = df.drop('risk_level', axis=1)
y = df['risk_level']

print("Training Random Forest Classifier...")
clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
clf.fit(X, y)

print(f"Model accuracy on training data: {clf.score(X, y):.2f}")

joblib.dump(clf, 'agents/financial_neglect_rf.pkl')
print("Model saved to agents/financial_neglect_rf.pkl")
