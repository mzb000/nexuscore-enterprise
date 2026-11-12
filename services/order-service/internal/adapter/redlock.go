package adapter

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redsync/redsync/v4"
	"github.com/go-redsync/redsync/v4/redis/goredis/v9"
	"github.com/nexuscore/order-service/internal/domain"
	goredislib "github.com/redis/go-redis/v9"
)

type RedlockManager struct {
	rs *redsync.Redsync
}

func NewRedlockManager(addrs []string, password string) *RedlockManager {
	pools := make([]redsync.Pool, 0, len(addrs))
	for _, addr := range addrs {
		client := goredislib.NewClient(&goredislib.Options{
			Addr:     addr,
			Password: password,
		})
		pools = append(pools, goredis.NewPool(client))
	}

	rs := redsync.New(pools...)
	return &RedlockManager{rs: rs}
}

func (rm *RedlockManager) Lock(ctx context.Context, key string) (func(context.Context) error, error) {
	mutex := rm.rs.NewMutex(
		key,
		redsync.WithExpiry(8*time.Second),
		redsync.WithTries(5),
		redsync.WithRetryDelay(150*time.Millisecond),
	)

	if err := mutex.LockContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to acquire redlock for key '%s': %w", key, err)
	}

	unlock := func(uCtx context.Context) error {
		_, err := mutex.UnlockContext(uCtx)
		return err
	}

	return unlock, nil
}

// Compile-time interface check
var _ domain.DistributedLock = (*RedlockManager)(nil)
