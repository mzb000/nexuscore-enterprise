package usecase

import (
	"context"
	"log/slog"
	"sync"
	"sync/atomic"
)

type Job func(ctx context.Context)

type WorkerPool struct {
	workerCount int
	jobQueue    chan Job
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
	logger      *slog.Logger
	jobsDone    uint64
}

func NewWorkerPool(workerCount, queueCapacity int, logger *slog.Logger) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	return &WorkerPool{
		workerCount: workerCount,
		jobQueue:    make(chan Job, queueCapacity),
		ctx:         ctx,
		cancel:      cancel,
		logger:      logger,
	}
}

func (wp *WorkerPool) Start() {
	wp.logger.Info("Starting Worker Pool Dispatcher", "workers", wp.workerCount)
	for i := 1; i <= wp.workerCount; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()
	for {
		select {
		case <-wp.ctx.Done():
			wp.logger.Debug("Worker stopping due to context cancellation", "worker_id", id)
			return
		case job, ok := <-wp.jobQueue:
			if !ok {
				return
			}
			job(wp.ctx)
			atomic.AddUint64(&wp.jobsDone, 1)
		}
	}
}

func (wp *WorkerPool) Submit(job Job) bool {
	select {
	case <-wp.ctx.Done():
		return false
	case wp.jobQueue <- job:
		return true
	default:
		wp.logger.Warn("Worker pool queue is saturated, rejecting job")
		return false
	}
}

func (wp *WorkerPool) Stop() {
	wp.logger.Info("Stopping Worker Pool Dispatcher...")
	wp.cancel()
	close(wp.jobQueue)
	wp.wg.Wait()
	wp.logger.Info("Worker Pool stopped cleanly", "total_jobs_completed", atomic.LoadUint64(&wp.jobsDone))
}
