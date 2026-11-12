package com.nexuscore.payment.cqrs.query;

import java.util.UUID;

public record GetPaymentQuery(UUID paymentId) {}
