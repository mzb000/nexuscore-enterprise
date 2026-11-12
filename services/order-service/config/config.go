package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port                     string
	Environment              string
	DatabaseURL              string
	RedisAddrs               []string
	RedisPassword            string
	KafkaBrokers             []string
	KafkaOrderEventsTopic    string
	KafkaOrderCommandsTopic  string
	KafkaConsumerGroup       string
	WorkerPoolSize           int
	WorkerQueueCapacity      int
}

func LoadConfig() *Config {
	return &Config{
		Port:                    getEnv("PORT", "50051"),
		Environment:             getEnv("ENVIRONMENT", "development"),
		DatabaseURL:             getEnv("DATABASE_URL", "postgres://nexus_user:nexus_secret@localhost:5432/nexus_orders?sslmode=disable"),
		RedisAddrs:              strings.Split(getEnv("REDIS_ADDRS", "localhost:6379"), ","),
		RedisPassword:           getEnv("REDIS_PASSWORD", ""),
		KafkaBrokers:            strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ","),
		KafkaOrderEventsTopic:   getEnv("KAFKA_ORDER_EVENTS_TOPIC", "nexus.order.events"),
		KafkaOrderCommandsTopic: getEnv("KAFKA_ORDER_COMMANDS_TOPIC", "nexus.order.commands"),
		KafkaConsumerGroup:      getEnv("KAFKA_CONSUMER_GROUP", "nexus-order-service-group"),
		WorkerPoolSize:          getEnvAsInt("WORKER_POOL_SIZE", 20),
		WorkerQueueCapacity:     getEnvAsInt("WORKER_QUEUE_CAPACITY", 1000),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}
