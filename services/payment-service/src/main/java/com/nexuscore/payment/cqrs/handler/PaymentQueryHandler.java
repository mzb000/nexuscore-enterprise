package com.nexuscore.payment.cqrs.handler;

import com.nexuscore.payment.cqrs.query.GetPaymentQuery;
import com.nexuscore.payment.domain.model.Payment;
import com.nexuscore.payment.domain.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PaymentQueryHandler {

    private final PaymentRepository paymentRepository;

    public PaymentQueryHandler(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Optional<Payment> handle(GetPaymentQuery query) {
        return paymentRepository.findById(query.paymentId());
    }
}
