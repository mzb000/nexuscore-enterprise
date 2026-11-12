"""
High-Performance Feature Engineering Pipeline using Polars & Pandas.
Extracts user transaction velocity, average basket value, and category preferences.
"""

import polars as pl
from datetime import datetime, timezone, timedelta
import numpy as np

def generate_mock_transactions(num_records: int = 1000) -> pl.DataFrame:
    np.random.seed(42)
    user_ids = [f"usr_{np.random.randint(100, 200)}" for _ in range(num_records)]
    amounts = np.random.exponential(scale=75.0, size=num_records).round(2)
    categories = np.random.choice(["electronics", "audio", "security", "hardware"], size=num_records)
    
    base_time = datetime.now(timezone.utc)
    timestamps = [base_time - timedelta(minutes=int(np.random.uniform(1, 14400))) for _ in range(num_records)]
    
    return pl.DataFrame({
        "user_id": user_ids,
        "amount": amounts,
        "category": categories,
        "timestamp": timestamps,
    })

def compute_customer_features(df: pl.DataFrame) -> pl.DataFrame:
    """Computes customer velocity and spending aggregates."""
    features = (
        df.group_by("user_id")
        .agg([
            pl.count().alias("tx_count_total"),
            pl.col("amount").sum().alias("total_spent"),
            pl.col("amount").mean().alias("avg_tx_amount"),
            pl.col("amount").std().fill_null(0.0).alias("std_tx_amount"),
            pl.col("amount").max().alias("max_single_tx"),
        ])
        .with_columns([
            (pl.col("total_spent") / pl.col("tx_count_total")).alias("calculated_avg_basket")
        ])
    )
    return features

if __name__ == "__main__":
    print("Running NexusCore Polars ETL Pipeline...")
    raw_df = generate_mock_transactions(5000)
    customer_features = compute_customer_features(raw_df)
    print("Feature computation complete. Shape:", customer_features.shape)
    print(customer_features.head(5))
