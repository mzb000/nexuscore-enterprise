package com.nexuscore.payment.domain.model;

public enum PaymentStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    SETTLED,
    FAILED,
    REFUNDED
}
