package com.nexuscore.payment.cqrs.command;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record AuthorizePaymentCommand(
    @NotNull UUID orderId,
    @NotBlank String customerId,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @NotBlank String currency,
    @NotBlank String paymentMethod,
    @NotBlank String rawPaymentToken, // Token to be encrypted via AES-256-GCM
    String idempotencyKey
) {}
