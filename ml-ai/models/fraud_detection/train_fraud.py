"""
Fraud Detection Classifier using Scikit-Learn.
Trains an ensemble tree model to detect fraudulent transactions using behavioral features.
"""

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import Pipeline

def generate_fraud_dataset(n_samples: int = 2000):
    np.random.seed(42)
    # Features: [amount, velocity_last_hour, distance_from_home_km, is_new_device]
    amounts = np.random.exponential(scale=100.0, size=n_samples)
    velocities = np.random.poisson(lam=2, size=n_samples)
    distances = np.random.exponential(scale=15.0, size=n_samples)
    new_devices = np.random.binomial(n=1, p=0.15, size=n_samples)

    X = np.column_stack([amounts, velocities, distances, new_devices])
    
    # Fraud rule: High amount + high velocity + far distance + new device
    fraud_risk = (amounts > 300).astype(int) * 2 + (velocities > 5).astype(int) * 2 + (distances > 50).astype(int) + new_devices * 2
    y = (fraud_risk >= 4).astype(int)
    
    return X, y

def train_and_evaluate():
    print("Generating training dataset for Fraud Detection...")
    X, y = generate_fraud_dataset(3000)
    print(f"Total Transactions: {len(y)}, Fraud Cases: {np.sum(y)} ({np.mean(y)*100:.2f}%)")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, class_weight="balanced"))
    ])

    print("Fitting model...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    print("\n=== Model Performance Report ===")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

if __name__ == "__main__":
    train_and_evaluate()
