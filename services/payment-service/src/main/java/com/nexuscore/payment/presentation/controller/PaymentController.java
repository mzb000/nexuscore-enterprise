package com.nexuscore.payment.presentation.controller;

import com.nexuscore.payment.cqrs.command.AuthorizePaymentCommand;
import com.nexuscore.payment.cqrs.handler.PaymentCommandHandler;
import com.nexuscore.payment.cqrs.handler.PaymentQueryHandler;
import com.nexuscore.payment.cqrs.query.GetPaymentQuery;
import com.nexuscore.payment.domain.model.Payment;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentCommandHandler commandHandler;
    private final PaymentQueryHandler queryHandler;

    public PaymentController(PaymentCommandHandler commandHandler, PaymentQueryHandler queryHandler) {
        this.commandHandler = commandHandler;
        this.queryHandler = queryHandler;
    }

    @PostMapping("/authorize")
    public ResponseEntity<Payment> authorizePayment(@Valid @RequestBody AuthorizePaymentCommand command) {
        Payment payment = commandHandler.handle(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPayment(@PathVariable UUID id) {
        return queryHandler.handle(new GetPaymentQuery(id))
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
