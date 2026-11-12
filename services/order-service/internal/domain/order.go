package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrOrderNotFound      = errors.New("order not found")
	ErrEmptyOrderItems    = errors.New("order must contain at least one item")
	ErrInvalidQuantity    = errors.New("item quantity must be greater than zero")
	ErrInvalidAmount      = errors.New("order total amount must be positive")
	ErrInvalidStateChange = errors.New("invalid state transition")
)

type OrderStatus string

const (
	StatusPending           OrderStatus = "PENDING"
	StatusStockReserved     OrderStatus = "STOCK_RESERVED"
	StatusPaymentAuthorized OrderStatus = "PAYMENT_AUTHORIZED"
	StatusConfirmed         OrderStatus = "CONFIRMED"
	StatusCancelled         OrderStatus = "CANCELLED"
	StatusFailed            OrderStatus = "FAILED"
)

type OrderItem struct {
	ProductID string  `json:"product_id"`
	SKU       string  `json:"sku"`
	Quantity  int32   `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
}

type Order struct {
	ID             uuid.UUID   `json:"id"`
	CustomerID     string      `json:"customer_id"`
	Status         OrderStatus `json:"status"`
	TotalAmount    float64     `json:"total_amount"`
	Currency       string      `json:"currency"`
	Items          []OrderItem `json:"items"`
	IdempotencyKey string      `json:"idempotency_key"`
	FailureReason  string      `json:"failure_reason,omitempty"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
}

func NewOrder(customerID, currency, idempotencyKey string, items []OrderItem) (*Order, error) {
	if customerID == "" {
		return nil, errors.New("customer ID cannot be empty")
	}
	if len(items) == 0 {
		return nil, ErrEmptyOrderItems
	}

	var total float64
	for _, item := range items {
		if item.Quantity <= 0 {
			return nil, ErrInvalidQuantity
		}
		if item.UnitPrice < 0 {
			return nil, ErrInvalidAmount
		}
		total += float64(item.Quantity) * item.UnitPrice
	}

	now := time.Now().UTC()
	return &Order{
		ID:             uuid.New(),
		CustomerID:     customerID,
		Status:         StatusPending,
		TotalAmount:    total,
		Currency:       currency,
		Items:          items,
		IdempotencyKey: idempotencyKey,
		CreatedAt:      now,
		UpdatedAt:      now,
	}, nil
}

func (o *Order) TransitionTo(target OrderStatus, reason string) error {
	switch target {
	case StatusStockReserved:
		if o.Status != StatusPending {
			return ErrInvalidStateChange
		}
	case StatusPaymentAuthorized:
		if o.Status != StatusStockReserved {
			return ErrInvalidStateChange
		}
	case StatusConfirmed:
		if o.Status != StatusPaymentAuthorized {
			return ErrInvalidStateChange
		}
	case StatusCancelled, StatusFailed:
		if o.Status == StatusConfirmed {
			return errors.New("cannot cancel or fail a confirmed order directly without refund flow")
		}
	default:
		return ErrInvalidStateChange
	}

	o.Status = target
	o.FailureReason = reason
	o.UpdatedAt = time.Now().UTC()
	return nil
}
