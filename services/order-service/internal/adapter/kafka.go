package adapter

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/nexuscore/order-service/internal/domain"
	"github.com/segmentio/kafka-go"
)

type KafkaAdapter struct {
	writer *kafka.Writer
	logger *slog.Logger
}

func NewKafkaAdapter(brokers []string, defaultTopic string, logger *slog.Logger) *KafkaAdapter {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Topic:        defaultTopic,
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		BatchSize:    100,
		Async:        false,
	}

	return &KafkaAdapter{
		writer: writer,
		logger: logger,
	}
}

func (k *KafkaAdapter) PublishEvent(ctx context.Context, topic string, key string, payload []byte) error {
	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: payload,
		Time:  time.Now().UTC(),
	}

	if err := k.writer.WriteMessages(ctx, msg); err != nil {
		k.logger.Error("Failed to publish message to Kafka", "topic", topic, "key", key, "error", err)
		return fmt.Errorf("kafka write failure: %w", err)
	}

	return nil
}

func (k *KafkaAdapter) StartConsumer(ctx context.Context, brokers []string, topic, groupID string, handler func(msg kafka.Message) error) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        brokers,
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       10e3, // 10KB
		MaxBytes:       10e6, // 10MB
		CommitInterval: time.Second,
	})

	go func() {
		defer reader.Close()
		k.logger.Info("Kafka Consumer started", "topic", topic, "group_id", groupID)

		for {
			m, err := reader.FetchMessage(ctx)
			if err != nil {
				if ctx.Err() != nil {
					k.logger.Info("Kafka consumer shutting down due to context completion")
					return
				}
				k.logger.Error("Kafka read error", "error", err)
				continue
			}

			if err := handler(m); err != nil {
				k.logger.Error("Error handling Kafka message", "offset", m.Offset, "error", err)
				continue
			}

			if err := reader.CommitMessages(ctx, m); err != nil {
				k.logger.Error("Failed to commit Kafka offset", "offset", m.Offset, "error", err)
			}
		}
	}()
}

func (k *KafkaAdapter) Close() error {
	return k.writer.Close()
}

// Compile-time interface check
var _ domain.EventPublisher = (*KafkaAdapter)(nil)
