package com.nexuscore.payment.infrastructure.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexuscore.payment.domain.event.PaymentAuthorizedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventProducer {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventProducer.class);
    private static final String TOPIC = "nexus.payment.events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public PaymentEventProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishPaymentAuthorized(PaymentAuthorizedEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, event.orderId().toString(), payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish PaymentAuthorizedEvent for order {}", event.orderId(), ex);
                    } else {
                        log.info("PaymentAuthorizedEvent published successfully for order {}", event.orderId());
                    }
                });
        } catch (Exception e) {
            log.error("Error serializing PaymentAuthorizedEvent", e);
        }
    }
}
