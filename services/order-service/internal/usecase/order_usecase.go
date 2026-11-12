package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/nexuscore/order-service/internal/domain"
)

type CreateOrderInput struct {
	CustomerID     string
	Currency       string
	IdempotencyKey string
	Items          []domain.OrderItem
}

type OrderUseCase struct {
	repo       domain.OrderRepository
	lock       domain.DistributedLock
	publisher  domain.EventPublisher
	workerPool *WorkerPool
	logger     *slog.Logger
}

func NewOrderUseCase(
	repo domain.OrderRepository,
	lock domain.DistributedLock,
	publisher domain.EventPublisher,
	workerPool *WorkerPool,
	logger *slog.Logger,
) *OrderUseCase {
	return &OrderUseCase{
		repo:       repo,
		lock:       lock,
		publisher:  publisher,
		workerPool: workerPool,
		logger:     logger,
	}
}

func (uc *OrderUseCase) CreateOrder(ctx context.Context, input CreateOrderInput) (*domain.Order, error) {
	// 1. Idempotency Check
	if input.IdempotencyKey != "" {
		existing, err := uc.repo.FindByIdempotencyKey(ctx, input.IdempotencyKey)
		if err == nil && existing != nil {
			uc.logger.Info("Returning idempotent order response", "order_id", existing.ID)
			return existing, nil
		}
	}

	// 2. Distributed Locking per Customer to prevent double-spending & race conditions
	lockKey := fmt.Sprintf("lock:order:customer:%s", input.CustomerID)
	unlock, err := uc.lock.Lock(ctx, lockKey)
	if err != nil {
		return nil, fmt.Errorf("unable to acquire distributed lock: %w", err)
	}
	defer func() {
		if unlockErr := unlock(ctx); unlockErr != nil {
			uc.logger.Warn("Failed to release distributed lock", "error", unlockErr)
		}
	}()

	// 3. Instantiate Domain Order
	order, err := domain.NewOrder(input.CustomerID, input.Currency, input.IdempotencyKey, input.Items)
	if err != nil {
		return nil, err
	}

	if err := uc.repo.Save(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to persist initial order: %w", err)
	}

	// 4. Execute Distributed Saga Transaction
	saga := NewSagaOrchestrator(uc.logger)

	// Step 1: Reserve Inventory
	saga.AddStep(SagaStep{
		Name: "ReserveInventory",
		Execute: func(sCtx context.Context) error {
			uc.logger.Info("Simulating stock reservation with Catalog Service", "order_id", order.ID)
			return order.TransitionTo(domain.StatusStockReserved, "")
		},
		Compensate: func(sCtx context.Context) error {
			uc.logger.Warn("Compensating: Releasing reserved stock", "order_id", order.ID)
			return nil
		},
	})

	// Step 2: Authorize Payment
	saga.AddStep(SagaStep{
		Name: "AuthorizePayment",
		Execute: func(sCtx context.Context) error {
			uc.logger.Info("Simulating payment authorization with Payment Service", "amount", order.TotalAmount)
			return order.TransitionTo(domain.StatusPaymentAuthorized, "")
		},
		Compensate: func(sCtx context.Context) error {
			uc.logger.Warn("Compensating: Voiding authorized payment", "order_id", order.ID)
			return nil
		},
	})

	// Step 3: Finalize Order Confirmation
	saga.AddStep(SagaStep{
		Name: "ConfirmOrder",
		Execute: func(sCtx context.Context) error {
			return order.TransitionTo(domain.StatusConfirmed, "")
		},
		Compensate: func(sCtx context.Context) error {
			return order.TransitionTo(domain.StatusCancelled, "Saga compensation triggered")
		},
	})

	// Execute the Saga
	if err := saga.Execute(ctx); err != nil {
		_ = order.TransitionTo(domain.StatusFailed, err.Error())
		_ = uc.repo.Update(ctx, order)
		return nil, fmt.Errorf("saga transaction aborted: %w", err)
	}

	// 5. Update persisted order state
	if err := uc.repo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to update confirmed order: %w", err)
	}

	// 6. Asynchronously publish event to Kafka via Worker Pool
	orderPayload, _ := json.Marshal(order)
	uc.workerPool.Submit(func(wCtx context.Context) {
		pubErr := uc.publisher.PublishEvent(wCtx, "nexus.order.events", order.ID.String(), orderPayload)
		if pubErr != nil {
			uc.logger.Error("Async Kafka event publication failed", "order_id", order.ID, "error", pubErr)
		} else {
			uc.logger.Info("OrderConfirmed event successfully dispatched to Kafka", "order_id", order.ID)
		}
	})

	return order, nil
}

func (uc *OrderUseCase) GetOrder(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	order, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, domain.ErrOrderNotFound
	}
	return order, nil
}

func (uc *OrderUseCase) CancelOrder(ctx context.Context, id uuid.UUID, reason string) (*domain.Order, error) {
	order, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, domain.ErrOrderNotFound
	}

	if err := order.TransitionTo(domain.StatusCancelled, reason); err != nil {
		return nil, errors.New("cannot cancel order in current state")
	}

	if err := uc.repo.Update(ctx, order); err != nil {
		return nil, err
	}

	return order, nil
}
