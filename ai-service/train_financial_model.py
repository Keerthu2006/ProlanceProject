import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

def generate_synthetic_data(n_samples=2000):
    np.random.seed(42)
    
    # 1. Project Budget
    budget = np.random.uniform(500, 10000, n_samples)
    
    # 2. Agreed Amount (usually close to budget, sometimes over)
    agreed_amount = budget * np.random.uniform(0.8, 1.2, n_samples)
    
    # 3. Budget Utilization = Agreed Amount / Budget
    budget_utilization = agreed_amount / budget
    
    # 4. Payment Delay in days (0 means no delay)
    payment_delay = np.random.exponential(scale=15, size=n_samples)
    payment_delay = np.clip(payment_delay - 5, 0, 100) # Many will be 0
    
    # 5. Overdue Milestones (count)
    overdue_milestones = np.random.poisson(lam=0.5, size=n_samples)
    
    # 6. Client Rating (1 to 5)
    client_rating = np.random.normal(loc=4.2, scale=0.8, size=n_samples)
    client_rating = np.clip(client_rating, 1, 5)
    
    # 7. Freelancer Rating (1 to 5)
    freelancer_rating = np.random.normal(loc=4.5, scale=0.6, size=n_samples)
    freelancer_rating = np.clip(freelancer_rating, 1, 5)

    df = pd.DataFrame({
        'budget': budget,
        'agreed_amount': agreed_amount,
        'budget_utilization': budget_utilization,
        'payment_delay': payment_delay,
        'overdue_milestones': overdue_milestones,
        'client_rating': client_rating,
        'freelancer_rating': freelancer_rating
    })
    
    # Risk calculation rules for the synthetic label
    # High Risk (2): High payment delay (> 14) OR multiple overdue milestones (> 1) OR very high budget utilization (> 1.1) with bad ratings
    # Medium Risk (1): Moderate delay (5-14) OR 1 overdue milestone OR budget utilization > 1.05
    # Low Risk (0): Everything else
    
    conditions = [
        (df['payment_delay'] > 14) | (df['overdue_milestones'] > 1) | ((df['budget_utilization'] > 1.1) & (df['client_rating'] < 3.5)),
        (df['payment_delay'] > 5) | (df['overdue_milestones'] == 1) | (df['budget_utilization'] > 1.05)
    ]
    choices = [2, 1]
    df['risk_level'] = np.select(conditions, choices, default=0)
    
    return df

def train_model():
    print("Generating synthetic financial data...")
    df = generate_synthetic_data()
    
    X = df.drop(columns=['risk_level'])
    y = df['risk_level']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    print("Evaluation Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    joblib.dump(model, 'financial_neglect_rf.pkl')
    print("Model saved to 'financial_neglect_rf.pkl'.")

if __name__ == "__main__":
    train_model()
