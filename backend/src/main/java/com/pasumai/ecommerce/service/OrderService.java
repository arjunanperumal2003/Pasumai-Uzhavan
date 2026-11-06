
package com.pasumai.ecommerce.service;

import com.pasumai.ecommerce.entity.Order;
import com.pasumai.ecommerce.entity.OrderItem;
import com.pasumai.ecommerce.repository.OrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;

    public OrderService(
            OrderRepository orderRepository,
            CartService cartService
    ) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
    }

    // =========================================================
    // CREATE ORDER
    // =========================================================

    @Transactional
    public Order createOrder(Order order) {

        // -----------------------------------------------------
        // VALIDATE USER
        // -----------------------------------------------------

        if (order == null) {
            throw new RuntimeException(
                    "Order data is required"
            );
        }

        if (order.getUserId() == null ||
                order.getUserId().isBlank()) {

            throw new RuntimeException(
                    "User ID is required"
            );
        }

        // -----------------------------------------------------
        // VALIDATE ADDRESS
        // -----------------------------------------------------

        if (order.getAddress() == null ||
                order.getAddress().isBlank()) {

            throw new RuntimeException(
                    "Delivery address is required"
            );
        }

        // -----------------------------------------------------
        // VALIDATE PAYMENT METHOD
        // -----------------------------------------------------

        if (order.getPaymentMethod() == null ||
                order.getPaymentMethod().isBlank()) {

            order.setPaymentMethod(
                    "Cash on Delivery"
            );
        }

        // -----------------------------------------------------
        // VALIDATE ITEMS
        // -----------------------------------------------------

        if (order.getItems() == null ||
                order.getItems().isEmpty()) {

            throw new RuntimeException(
                    "Order must contain at least one product"
            );
        }

        // -----------------------------------------------------
        // PREPARE ORDER ITEMS
        // -----------------------------------------------------

        List<OrderItem> validItems =
                new ArrayList<>();

        BigDecimal calculatedTotal =
                BigDecimal.ZERO;

        for (OrderItem item : order.getItems()) {

            // -------------------------------------------------
            // PRODUCT ID
            // -------------------------------------------------

            if (item.getProductId() == null ||
                    item.getProductId().isBlank()) {

                throw new RuntimeException(
                        "Product ID is required"
                );
            }

            // -------------------------------------------------
            // PRODUCT NAME
            // -------------------------------------------------

            if (item.getName() == null ||
                    item.getName().isBlank()) {

                item.setName("Product");
            }

            // -------------------------------------------------
            // QUANTITY
            // -------------------------------------------------

            Integer qty = item.getQty();

            if (qty == null || qty <= 0) {
                qty = 1;
                item.setQty(qty);
            }

            // -------------------------------------------------
            // PRICE
            // -------------------------------------------------

            BigDecimal price =
                    item.getSellingPrice();

            if (price == null ||
                    price.compareTo(BigDecimal.ZERO) < 0) {

                throw new RuntimeException(
                        "Invalid selling price for product: "
                                + item.getName()
                );
            }

            // -------------------------------------------------
            // CALCULATE ITEM TOTAL
            // -------------------------------------------------

            BigDecimal itemTotal =
                    price.multiply(
                            BigDecimal.valueOf(qty)
                    );

            calculatedTotal =
                    calculatedTotal.add(itemTotal);

            validItems.add(item);
        }

        // -----------------------------------------------------
        // SET SERVER-CALCULATED TOTAL
        // -----------------------------------------------------
        //
        // Do NOT trust the totalAmount sent by the browser.
        //
        // Example:
        //
        // Urea       ₹250 × 2 = ₹500
        // DAP        ₹250 × 1 = ₹250
        //
        // Total = ₹750
        //
        // -----------------------------------------------------

        order.setTotalAmount(calculatedTotal);

        // -----------------------------------------------------
        // SET ORDER STATUS
        // -----------------------------------------------------

        if (order.getStatus() == null) {

            order.setStatus(
                    Order.OrderStatus.Placed
            );
        }

        // -----------------------------------------------------
        // SET ITEMS
        // -----------------------------------------------------

        order.setItems(validItems);

        // -----------------------------------------------------
        // SAVE ORDER + ORDER ITEMS
        // -----------------------------------------------------
        //
        // Because Order.java contains:
        //
        // cascade = CascadeType.ALL
        //
        // JPA automatically saves OrderItems.
        //
        // -----------------------------------------------------

        Order savedOrder =
                orderRepository.save(order);

        // -----------------------------------------------------
        // CLEAR CART
        // -----------------------------------------------------
        //
        // Cart is cleared only AFTER order.save succeeds.
        //
        // -----------------------------------------------------

        if (savedOrder.getUserId() != null) {

            cartService.clearUserCart(
                    savedOrder.getUserId()
            );
        }

        return savedOrder;
    }

    // =========================================================
    // GET ALL ORDERS OF USER
    // =========================================================

    public List<Order> getOrdersByUserId(
            String userId
    ) {

        if (userId == null ||
                userId.isBlank()) {

            throw new RuntimeException(
                    "User ID is required"
            );
        }

        return orderRepository
                .findByUserIdOrderByCreatedAtDesc(
                        userId
                );
    }

    // =========================================================
    // GET ORDER BY ID
    // =========================================================

    public Optional<Order> getOrderById(
            String orderId
    ) {

        if (orderId == null ||
                orderId.isBlank()) {

            return Optional.empty();
        }

        return orderRepository.findById(
                orderId
        );
    }

    // =========================================================
    // CANCEL ORDER
    // =========================================================

    @Transactional
    public Optional<Order> cancelOrder(
            String orderId,
            String reason
    ) {

        return orderRepository
                .findById(orderId)
                .map(order -> {

                    order.setStatus(
                            Order.OrderStatus.Cancelled
                    );

                    order.setCancelReason(
                            reason
                    );

                    return orderRepository.save(
                            order
                    );
                });
    }
}

