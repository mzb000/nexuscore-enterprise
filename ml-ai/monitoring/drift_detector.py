"""
MLOps Data & Concept Drift Detector.
Computes Population Stability Index (PSI) and Kolmogorov-Smirnov test to detect feature distribution shifts.
"""

import numpy as np
from scipy import stats
from typing import Dict, Any

def calculate_psi(baseline: np.ndarray, target: np.ndarray, num_buckets: int = 10) -> float:
    """Calculates Population Stability Index (PSI) between baseline and production distributions."""
    # Compute quantiles from baseline
    quantiles = np.linspace(0, 100, num_buckets + 1)
    bucket_bounds = np.percentile(baseline, quantiles)
    bucket_bounds[0] = -np.inf
    bucket_bounds[-1] = np.inf

    # Count frequencies
    base_counts, _ = np.histogram(baseline, bins=bucket_bounds)
    target_counts, _ = np.histogram(target, bins=bucket_bounds)

    # Convert to proportions with epsilon smoothing to prevent div by zero
    eps = 1e-4
    base_pct = (base_counts / len(baseline)) + eps
    target_pct = (target_counts / len(target)) + eps

    # Re-normalize
    base_pct = base_pct / np.sum(base_pct)
    target_pct = target_pct / np.sum(target_pct)

    # PSI Formula: sum((target - base) * ln(target / base))
    psi_val = np.sum((target_pct - base_pct) * np.log(target_pct / base_pct))
    return float(psi_val)

def check_feature_drift(baseline: np.ndarray, current: np.ndarray, feature_name: str) -> Dict[str, Any]:
    psi = calculate_psi(baseline, current)
    ks_stat, p_value = stats.ks_2samp(baseline, current)

    # Industry standard PSI thresholds
    # PSI < 0.1: No significant change
    # 0.1 <= PSI < 0.2: Moderate change
    # PSI >= 0.2: Significant distribution drift (Retraining triggered)
    if psi < 0.1:
        drift_status = "STABLE"
    elif psi < 0.2:
        drift_status = "WARNING_MODERATE_DRIFT"
    else:
        drift_status = "ALERT_CRITICAL_DRIFT"

    return {
        "feature": feature_name,
        "psi": round(psi, 4),
        "ks_statistic": round(ks_stat, 4),
        "p_value": round(p_value, 5),
        "status": drift_status,
        "requires_retraining": psi >= 0.2
    }

if __name__ == "__main__":
    np.random.seed(42)
    # 1. Stable baseline vs normal production
    baseline_amounts = np.random.normal(loc=100.0, scale=25.0, size=2000)
    current_normal = np.random.normal(loc=101.5, scale=24.8, size=1500)
    report_stable = check_feature_drift(baseline_amounts, current_normal, "transaction_amount_normal")
    print("Normal Report:", report_stable)

    # 2. Injected inflation/surge drift
    current_drifted = np.random.normal(loc=140.0, scale=40.0, size=1500)
    report_drift = check_feature_drift(baseline_amounts, current_drifted, "transaction_amount_surge")
    print("Drift Alert Report:", report_drift)
