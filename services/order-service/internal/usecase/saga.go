package usecase

import (
	"context"
	"fmt"
	"log/slog"
)

type SagaStep struct {
	Name       string
	Execute    func(ctx context.Context) error
	Compensate func(ctx context.Context) error
}

type SagaOrchestrator struct {
	steps      []SagaStep
	executed   []SagaStep
	logger     *slog.Logger
}

func NewSagaOrchestrator(logger *slog.Logger) *SagaOrchestrator {
	return &SagaOrchestrator{
		steps:    make([]SagaStep, 0),
		executed: make([]SagaStep, 0),
		logger:   logger,
	}
}

func (s *SagaOrchestrator) AddStep(step SagaStep) *SagaOrchestrator {
	s.steps = append(s.steps, step)
	return s
}

func (s *SagaOrchestrator) Execute(ctx context.Context) error {
	for _, step := range s.steps {
		s.logger.Info("Executing Saga Step", "step", step.Name)
		if err := step.Execute(ctx); err != nil {
			s.logger.Error("Saga Step failed, initiating compensations", "step", step.Name, "error", err)
			compensationErr := s.rollback(ctx)
			if compensationErr != nil {
				return fmt.Errorf("step '%s' failed: %w; compensation also failed: %v", step.Name, err, compensationErr)
			}
			return fmt.Errorf("step '%s' failed: %w; compensations executed successfully", step.Name, err)
		}
		s.executed = append(s.executed, step)
	}

	s.logger.Info("All Saga Steps completed successfully")
	return nil
}

func (s *SagaOrchestrator) rollback(ctx context.Context) error {
	var compErrors []error
	// Execute compensating actions in reverse order of executed forward steps
	for i := len(s.executed) - 1; i >= 0; i-- {
		step := s.executed[i]
		if step.Compensate != nil {
			s.logger.Warn("Executing Compensating Action", "step", step.Name)
			if err := step.Compensate(ctx); err != nil {
				s.logger.Error("Compensating action failed", "step", step.Name, "error", err)
				compErrors = append(compErrors, fmt.Errorf("compensate '%s': %w", step.Name, err))
			}
		}
	}

	if len(compErrors) > 0 {
		return fmt.Errorf("multiple compensation errors: %v", compErrors)
	}
	return nil
}
