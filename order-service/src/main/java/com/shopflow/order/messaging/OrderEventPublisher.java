package com.shopflow.order.messaging;

// RabbitMQ temporarily disabled
// Will be re-enabled when adding Kafka/RabbitMQ back
public class OrderEventPublisher {
    public static final String EXCHANGE = "shopflow.events";
    public static final String QUEUE = "order.placed";
    public static final String ROUTING_KEY = "order.placed";
}