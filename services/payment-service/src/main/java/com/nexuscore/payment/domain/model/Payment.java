package com.nexuscore.payment.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_order_id", columnList = "orderId"),
    @Index(name = "idx_payments_idempotency", columnList = "idempotencyKey", unique = true)
})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(length = 100)
    private String paymentMethod; // e.g., CREDIT_CARD, BANK_TRANSFER, CRYPTO

    // Column-level AES-256-GCM encrypted payload
    @Lob
    @Column(nullable = false)
    private String encryptedPaymentToken;

    @Column(unique = true, length = 255)
    private String idempotencyKey;

    @Column(length = 255)
    private String transactionReference;

    @Column(length = 500)
    private String failureReason;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Payment() {}

    public Payment(UUID orderId, String customerId, BigDecimal amount, String currency, String paymentMethod, String encryptedPaymentToken, String idempotencyKey) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.encryptedPaymentToken = encryptedPaymentToken;
        this.idempotencyKey = idempotencyKey;
        this.status = PaymentStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void markAuthorized(String transactionReference) {
        this.status = PaymentStatus.AUTHORIZED;
        this.transactionReference = transactionReference;
        this.updatedAt = Instant.now();
    }

    public void markFailed(String reason) {
        this.status = PaymentStatus.FAILED;
        this.failureReason = reason;
        this.updatedAt = Instant.now();
    }

    public void markRefunded() {
        this.status = PaymentStatus.REFUNDED;
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public UUID getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public PaymentStatus getStatus() { return status; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getEncryptedPaymentToken() { return encryptedPaymentToken; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getTransactionReference() { return transactionReference; }
    public String getFailureReason() { return failureReason; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
