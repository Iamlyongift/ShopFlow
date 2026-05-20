package com.shopflow.order.service;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    private static final String TOPIC = "order.placed";

    private final KafkaTemplate<String, String> kafkaTemplate;

    // Spring automatically injects KafkaTemplate when this class is created
    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishOrderPlaced(String orderJson) {
        kafkaTemplate.send(TOPIC, orderJson);
        System.out.println("📤 Published to Kafka topic [" + TOPIC + "]: " + orderJson);
    }
}