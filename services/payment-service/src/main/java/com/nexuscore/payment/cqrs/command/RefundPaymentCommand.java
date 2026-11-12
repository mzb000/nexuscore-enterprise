package com.nexuscore.payment.cqrs.command;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RefundPaymentCommand(
    @NotNull UUID paymentId,
    String reason
) {}
