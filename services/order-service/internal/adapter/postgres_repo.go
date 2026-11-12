package adapter

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexuscore/order-service/internal/domain"
)

type PostgresOrderRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresOrderRepository(ctx context.Context, connString string) (*PostgresOrderRepository, error) {
	cfg, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse pg connection string: %w", err)
	}

	cfg.MaxConns = 50
	cfg.MinConns = 5
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("unable to establish postgres pool: %w", err)
	}

	repo := &PostgresOrderRepository{pool: pool}
	if err := repo.initSchema(ctx); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate orders table: %w", err)
	}

	return repo, nil
}

func (r *PostgresOrderRepository) initSchema(ctx context.Context) error {
	query := `
	CREATE TABLE IF NOT EXISTS orders (
		id UUID PRIMARY KEY,
		customer_id VARCHAR(255) NOT NULL,
		status VARCHAR(50) NOT NULL,
		total_amount NUMERIC(12, 2) NOT NULL,
		currency VARCHAR(10) NOT NULL,
		items JSONB NOT NULL,
		idempotency_key VARCHAR(255) UNIQUE,
		failure_reason TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);
	CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
	CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
	`
	_, err := r.pool.Exec(ctx, query)
	return err
}

func (r *PostgresOrderRepository) Save(ctx context.Context, order *domain.Order) error {
	itemsJSON, err := json.Marshal(order.Items)
	if err != nil {
		return fmt.Errorf("error serializing order items: %w", err)
	}

	query := `
	INSERT INTO orders (id, customer_id, status, total_amount, currency, items, idempotency_key, failure_reason, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err = r.pool.Exec(ctx, query,
		order.ID,
		order.CustomerID,
		string(order.Status),
		order.TotalAmount,
		order.Currency,
		itemsJSON,
		order.IdempotencyKey,
		order.FailureReason,
		order.CreatedAt,
		order.UpdatedAt,
	)
	return err
}

func (r *PostgresOrderRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	query := `
	SELECT id, customer_id, status, total_amount, currency, items, idempotency_key, failure_reason, created_at, updated_at
	FROM orders WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	return r.scanOrder(row)
}

func (r *PostgresOrderRepository) FindByIdempotencyKey(ctx context.Context, key string) (*domain.Order, error) {
	if key == "" {
		return nil, nil
	}
	query := `
	SELECT id, customer_id, status, total_amount, currency, items, idempotency_key, failure_reason, created_at, updated_at
	FROM orders WHERE idempotency_key = $1
	`
	row := r.pool.QueryRow(ctx, query, key)
	return r.scanOrder(row)
}

func (r *PostgresOrderRepository) Update(ctx context.Context, order *domain.Order) error {
	itemsJSON, err := json.Marshal(order.Items)
	if err != nil {
		return err
	}

	query := `
	UPDATE orders
	SET status = $2, failure_reason = $3, items = $4, updated_at = $5
	WHERE id = $1
	`
	cmdTag, err := r.pool.Exec(ctx, query, order.ID, string(order.Status), order.FailureReason, itemsJSON, time.Now().UTC())
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return domain.ErrOrderNotFound
	}
	return nil
}

func (r *PostgresOrderRepository) scanOrder(row pgx.Row) (*domain.Order, error) {
	var (
		id             uuid.UUID
		customerID     string
		statusStr      string
		totalAmount    float64
		currency       string
		itemsRaw       []byte
		idempotencyKey *string
		failureReason  *string
		createdAt      time.Time
		updatedAt      time.Time
	)

	err := row.Scan(&id, &customerID, &statusStr, &totalAmount, &currency, &itemsRaw, &idempotencyKey, &failureReason, &createdAt, &updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	var items []domain.OrderItem
	if err := json.Unmarshal(itemsRaw, &items); err != nil {
		return nil, fmt.Errorf("failed to deserialize items JSON: %w", err)
	}

	order := &domain.Order{
		ID:          id,
		CustomerID:  customerID,
		Status:      domain.OrderStatus(statusStr),
		TotalAmount: totalAmount,
		Currency:    currency,
		Items:       items,
		CreatedAt:   createdAt,
		UpdatedAt:   updatedAt,
	}
	if idempotencyKey != nil {
		order.IdempotencyKey = *idempotencyKey
	}
	if failureReason != nil {
		order.FailureReason = *failureReason
	}

	return order, nil
}

func (r *PostgresOrderRepository) Close() {
	r.pool.Close()
}

// Compile-time interface check
var _ domain.OrderRepository = (*PostgresOrderRepository)(nil)
