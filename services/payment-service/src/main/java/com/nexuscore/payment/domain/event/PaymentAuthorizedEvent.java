package com.nexuscore.payment.domain.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentAuthorizedEvent(
    UUID paymentId,
    UUID orderId,
    String customerId,
    BigDecimal amount,
    String currency,
    String transactionReference,
    Instant timestamp
) {}
