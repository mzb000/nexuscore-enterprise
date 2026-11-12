package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nexuscore/order-service/config"
	"github.com/nexuscore/order-service/internal/adapter"
	"github.com/nexuscore/order-service/internal/usecase"
	"github.com/segmentio/kafka-go"
)

func main() {
	// 1. Structured JSON Logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	logger.Info("Bootstrapping NexusCore Order Service (Golang 1.23 DDD Core)...")

	// 2. Load Configuration
	cfg := config.LoadConfig()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 3. PostgreSQL Database Connection
	postgresRepo, err := adapter.NewPostgresOrderRepository(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("Failed to initialize PostgreSQL repository", "error", err)
		os.Exit(1)
	}
	defer postgresRepo.Close()
	logger.Info("Connected to PostgreSQL Order Database.")

	// 4. Redis Redlock Manager
	redlock := adapter.NewRedlockManager(cfg.RedisAddrs, cfg.RedisPassword)
	logger.Info("Initialized Redlock Distributed Mutex Pool.")

	// 5. Kafka Adapter (Producer & Consumer)
	kafkaAdapter := adapter.NewKafkaAdapter(cfg.KafkaBrokers, cfg.KafkaOrderEventsTopic, logger)
	defer kafkaAdapter.Close()
	logger.Info("Connected to Apache Kafka Cluster.")

	// 6. Worker Pool Dispatcher
	workerPool := usecase.NewWorkerPool(cfg.WorkerPoolSize, cfg.WorkerQueueCapacity, logger)
	workerPool.Start()
	defer workerPool.Stop()

	// 7. Order UseCase (Application Service)
	orderUseCase := usecase.NewOrderUseCase(
		postgresRepo,
		redlock,
		kafkaAdapter,
		workerPool,
		logger,
	)

	// 8. Start Background Kafka Event Consumer for Order Commands
	kafkaAdapter.StartConsumer(ctx, cfg.KafkaBrokers, cfg.KafkaOrderCommandsTopic, cfg.KafkaConsumerGroup, func(msg kafka.Message) error {
		logger.Info("Received command from Kafka", "key", string(msg.Key), "offset", msg.Offset)
		return nil
	})

	// 9. gRPC Server
	grpcServer := adapter.NewGRPCServer(orderUseCase, logger)

	go func() {
		if err := grpcServer.Start(cfg.Port); err != nil {
			logger.Error("gRPC server fatal error", "error", err)
		}
	}()

	// 10. Graceful Shutdown Listener
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	sig := <-stopChan
	logger.Warn("Shutdown signal received", "signal", sig.String())

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	// Terminate gRPC listeners cleanly
	grpcServer.GracefulStop()

	// Cancel background consumer context
	cancel()

	<-shutdownCtx.Done()
	logger.Info("NexusCore Order Service stopped cleanly.")
}
