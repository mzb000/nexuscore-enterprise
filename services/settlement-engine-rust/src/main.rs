use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettlementRecord {
    pub id: Uuid,
    pub order_id: Uuid,
    pub vendor_id: String,
    pub amount: f64,
    pub currency: String,
    pub previous_hash: String,
    pub record_hash: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SettleTransactionRequest {
    pub order_id: Uuid,
    pub vendor_id: String,
    pub amount: f64,
    pub currency: String,
}

#[derive(Clone)]
pub struct AppState {
    pub ledger: Arc<RwLock<Vec<SettlementRecord>>>,
    pub last_hash: Arc<RwLock<String>>,
}

#[tokio::main]
async fn main() {
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber).unwrap();

    info!("Starting NexusCore Rust High-Throughput Settlement Engine...");

    let state = AppState {
        ledger: Arc::new(RwLock::new(Vec::new())),
        last_hash: Arc::new(RwLock::new("0000000000000000000000000000000000000000000000000000000000000000".to_string())),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/settlements", post(settle_transaction))
        .route("/api/v1/settlements", get(list_settlements))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8085));
    info!("Rust Settlement Engine listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, Json(serde_json::json!({
        "status": "healthy",
        "service": "settlement-engine-rust",
        "concurrency_runtime": "Tokio Async"
    })))
}

async fn settle_transaction(
    State(state): State<AppState>,
    Json(payload): Json<SettleTransactionRequest>,
) -> Result<Json<SettlementRecord>, StatusCode> {
    if payload.amount <= 0.0 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let record_id = Uuid::new_v4();
    let now = Utc::now();

    let mut last_hash_lock = state.last_hash.write().await;
    let prev_hash = last_hash_lock.clone();

    // Compute cryptographic SHA-256 hash-chain block
    let mut hasher = Sha256::new();
    hasher.update(record_id.as_bytes());
    hasher.update(payload.order_id.as_bytes());
    hasher.update(payload.vendor_id.as_bytes());
    hasher.update(payload.amount.to_le_bytes());
    hasher.update(prev_hash.as_bytes());
    hasher.update(now.to_rfc3339().as_bytes());
    
    let computed_hash = hex::encode(hasher.finalize());
    *last_hash_lock = computed_hash.clone();

    let record = SettlementRecord {
        id: record_id,
        order_id: payload.order_id,
        vendor_id: payload.vendor_id,
        amount: payload.amount,
        currency: payload.currency,
        previous_hash: prev_hash,
        record_hash: computed_hash,
        timestamp: now,
    };

    let mut ledger_lock = state.ledger.write().await;
    ledger_lock.push(record.clone());

    info!(
        "Settled transaction: id={}, amount={}, hash={}",
        record.id, record.amount, record.record_hash
    );

    Ok(Json(record))
}

async fn list_settlements(State(state): State<AppState>) -> Json<Vec<SettlementRecord>> {
    let ledger_lock = state.ledger.read().await;
    Json(ledger_lock.clone())
}
