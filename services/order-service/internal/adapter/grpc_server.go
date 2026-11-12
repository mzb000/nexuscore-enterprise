package adapter

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"time"

	"github.com/google/uuid"
	"github.com/nexuscore/order-service/internal/domain"
	"github.com/nexuscore/order-service/internal/usecase"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
)

// Request & Response Data Transfer Objects for gRPC Wire Format
type CreateOrderReqDTO struct {
	CustomerID     string
	Currency       string
	IdempotencyKey string
	Items          []domain.OrderItem
}

type OrderRespDTO struct {
	OrderID     string
	CustomerID  string
	Status      string
	TotalAmount float64
	Currency    string
	CreatedAt   string
}

type GRPCServer struct {
	useCase *usecase.OrderUseCase
	logger  *slog.Logger
	server  *grpc.Server
}

func NewGRPCServer(useCase *usecase.OrderUseCase, logger *slog.Logger) *GRPCServer {
	srv := grpc.NewServer(
		grpc.ConnectionTimeout(5 * time.Second),
	)

	server := &GRPCServer{
		useCase: useCase,
		logger:  logger,
		server:  srv,
	}

	reflection.Register(srv)
	return server
}

func (s *GRPCServer) HandleCreateOrder(ctx context.Context, req CreateOrderReqDTO) (*OrderRespDTO, error) {
	s.logger.Info("gRPC CreateOrder Request Received", "customer_id", req.CustomerID)

	input := usecase.CreateOrderInput{
		CustomerID:     req.CustomerID,
		Currency:       req.Currency,
		IdempotencyKey: req.IdempotencyKey,
		Items:          req.Items,
	}

	order, err := s.useCase.CreateOrder(ctx, input)
	if err != nil {
		s.logger.Error("Failed to process CreateOrder", "error", err)
		return nil, status.Errorf(codes.Internal, "order creation failed: %v", err)
	}

	return &OrderRespDTO{
		OrderID:     order.ID.String(),
		CustomerID:  order.CustomerID,
		Status:      string(order.Status),
		TotalAmount: order.TotalAmount,
		Currency:    order.Currency,
		CreatedAt:   order.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (s *GRPCServer) HandleGetOrder(ctx context.Context, orderIDStr string) (*OrderRespDTO, error) {
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order UUID: %v", err)
	}

	order, err := s.useCase.GetOrder(ctx, orderID)
	if err != nil {
		if err == domain.ErrOrderNotFound {
			return nil, status.Errorf(codes.NotFound, "order not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to query order: %v", err)
	}

	return &OrderRespDTO{
		OrderID:     order.ID.String(),
		CustomerID:  order.CustomerID,
		Status:      string(order.Status),
		TotalAmount: order.TotalAmount,
		Currency:    order.Currency,
		CreatedAt:   order.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (s *GRPCServer) Start(port string) error {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		return fmt.Errorf("failed to listen on port %s: %w", port, err)
	}

	s.logger.Info("NexusCore Order gRPC Server is listening", "port", port)
	return s.server.Serve(lis)
}

func (s *GRPCServer) GracefulStop() {
	s.logger.Info("Gracefully stopping gRPC Server...")
	s.server.GracefulStop()
}
