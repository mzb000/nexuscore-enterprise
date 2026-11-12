package com.nexuscore.payment.cqrs.handler;

import com.nexuscore.payment.cqrs.command.AuthorizePaymentCommand;
import com.nexuscore.payment.domain.event.PaymentAuthorizedEvent;
import com.nexuscore.payment.domain.model.Payment;
import com.nexuscore.payment.domain.repository.PaymentRepository;
import com.nexuscore.payment.infrastructure.kafka.PaymentEventProducer;
import com.nexuscore.payment.security.AESGCMEncryptionService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentCommandHandler {

    private static final Logger log = LoggerFactory.getLogger(PaymentCommandHandler.class);

    private final PaymentRepository paymentRepository;
    private final AESGCMEncryptionService encryptionService;
    private final PaymentEventProducer eventProducer;

    public PaymentCommandHandler(
        PaymentRepository paymentRepository,
        AESGCMEncryptionService encryptionService,
        PaymentEventProducer eventProducer
    ) {
        this.paymentRepository = paymentRepository;
        this.encryptionService = encryptionService;
        this.eventProducer = eventProducer;
    }

    @Transactional
    @CircuitBreaker(name = "paymentGateway", fallbackMethod = "authorizeFallback")
    @Retry(name = "paymentGateway")
    public Payment handle(AuthorizePaymentCommand command) {
        log.info("Processing AuthorizePaymentCommand for order: {}", command.orderId());

        // 1. Idempotency Check
        if (command.idempotencyKey() != null && !command.idempotencyKey().isBlank()) {
            Optional<Payment> existing = paymentRepository.findByIdempotencyKey(command.idempotencyKey());
            if (existing.isPresent()) {
                log.info("Idempotent payment returned for key: {}", command.idempotencyKey());
                return existing.get();
            }
        }

        // 2. Encrypt sensitive token using AES-256-GCM
        String encryptedToken = encryptionService.encrypt(command.rawPaymentToken());

        // 3. Create domain entity
        Payment payment = new Payment(
            command.orderId(),
            command.customerId(),
            command.amount(),
            command.currency(),
            command.paymentMethod(),
            encryptedToken,
            command.idempotencyKey()
        );

        // 4. Simulate External Payment Gateway (Stripe/Bank PSP API call)
        String txnRef = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        payment.markAuthorized(txnRef);

        Payment saved = paymentRepository.save(payment);

        // 5. Publish Event to Kafka for Saga Orchestration
        eventProducer.publishPaymentAuthorized(new PaymentAuthorizedEvent(
            saved.getId(),
            saved.getOrderId(),
            saved.getCustomerId(),
            saved.getAmount(),
            saved.getCurrency(),
            saved.getTransactionReference(),
            Instant.now()
        ));

        return saved;
    }

    // Circuit Breaker Fallback
    public Payment authorizeFallback(AuthorizePaymentCommand command, Throwable t) {
        log.error("Payment Gateway Circuit Breaker Open or Request Failed: {}", t.getMessage());
        String encryptedToken = encryptionService.encrypt(command.rawPaymentToken());
        Payment failedPayment = new Payment(
            command.orderId(),
            command.customerId(),
            command.amount(),
            command.currency(),
            command.paymentMethod(),
            encryptedToken,
            command.idempotencyKey()
        );
        failedPayment.markFailed("Payment gateway circuit breaker open: " + t.getMessage());
        return paymentRepository.save(failedPayment);
    }
}
