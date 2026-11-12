package domain

import (
	"context"

	"github.com/google/uuid"
)

type OrderRepository interface {
	Save(ctx context.Context, order *Order) error
	FindByID(ctx context.Context, id uuid.UUID) (*Order, error)
	FindByIdempotencyKey(ctx context.Context, key string) (*Order, error)
	Update(ctx context.Context, order *Order) error
}

type EventPublisher interface {
	PublishEvent(ctx context.Context, topic string, key string, payload []byte) error
}

type DistributedLock interface {
	Lock(ctx context.Context, key string) (func(context.Context) error, error)
}
