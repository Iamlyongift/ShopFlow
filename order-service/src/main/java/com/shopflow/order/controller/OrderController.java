package com.shopflow.order.controller;


import com.shopflow.order.entity.Order;
import com.shopflow.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("order-service is up");
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getOrders());
    }

    @PostMapping("/create")
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        return ResponseEntity.ok(orderService.createOrder(order));
    }

    @PostMapping("/{id}")
    public ResponseEntity<Order> getOrdersByUser(@PathVariable Long id) {
         return orderService.getOrderById(id)
                 .map(ResponseEntity::ok)
                 .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/userId")
    public ResponseEntity<List<Order>> getOrderById(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomerId(userId));
    }
}
