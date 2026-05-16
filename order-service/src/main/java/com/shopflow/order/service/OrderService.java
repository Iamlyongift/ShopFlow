package com.shopflow.order.service;

import com.shopflow.order.entity.Order;
//import com.shopflow.order.messaging.OrderEventPublisher;
import com.shopflow.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    //private final OrderEventPublisher  eventPublisher;

    public Order createOrder(Order order) {
        Order savedOrder = orderRepository.save(order);
        //eventPublisher.publishOrderPlaced(savedOrder);
        return savedOrder;
    }

    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    public Optional<Order> getOrderById(long id) {
        return orderRepository.findById(id);
    }

    public List<Order> getOrdersByCustomerId(long customerId) {
        return orderRepository.findByUserId(customerId);
    }
}
