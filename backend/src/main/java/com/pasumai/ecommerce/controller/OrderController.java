package com.pasumai.ecommerce.controller;

import com.pasumai.ecommerce.entity.Order;
import com.pasumai.ecommerce.service.OrderService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(
        origins = "http://localhost:3000",
        allowCredentials = "true"
)
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }


    // =========================================================
    // GET MY ORDERS USING SESSION
    // =========================================================
    //
    // GET /api/orders/my
    //
    // Uses JSESSIONID
    // No localStorage required
    //
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<?> getMyOrders(
            HttpSession session
    ) {

        try {

            // -------------------------------------------------
            // GET LOGGED-IN USER ID FROM SESSION
            // -------------------------------------------------

            String userId =
                    (String) session.getAttribute("userId");


            // -------------------------------------------------
            // USER NOT LOGGED IN
            // -------------------------------------------------

            if (userId == null || userId.isBlank()) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(
                                Map.of(
                                        "success", false,
                                        "message",
                                        "Please login to view your orders"
                                )
                        );
            }


            // -------------------------------------------------
            // GET USER ORDERS
            // -------------------------------------------------

            List<Order> orders =
                    orderService.getOrdersByUserId(userId);


            // -------------------------------------------------
            // IMPORTANT
            //
            // NO ORDERS SHOULD RETURN []
            // NOT 404
            // -------------------------------------------------

            if (orders == null) {

                orders = Collections.emptyList();
            }


            return ResponseEntity.ok(orders);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Failed to get orders"
                            )
                    );
        }
    }


    // =========================================================
    // GET USER ORDERS BY USER ID
    // =========================================================
    //
    // GET /api/orders/user/{userId}
    //
    // =========================================================

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(
            @PathVariable String userId
    ) {

        try {

            List<Order> orders =
                    orderService.getOrdersByUserId(userId);


            // IMPORTANT:
            // Return empty array if no orders exist

            if (orders == null) {

                orders = Collections.emptyList();
            }


            return ResponseEntity.ok(orders);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Failed to get orders"
                            )
                    );
        }
    }


    // =========================================================
    // GET SINGLE ORDER
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(
            @PathVariable String id
    ) {

        try {

            Optional<Order> optionalOrder =
                    orderService.getOrderById(id);


            if (optionalOrder.isPresent()) {

                return ResponseEntity.ok(
                        optionalOrder.get()
                );
            }


            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message", "Order not found"
                            )
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Failed to get order"
                            )
                    );
        }
    }


    // =========================================================
    // CREATE ORDER
    // =========================================================
    //
    // POST /api/orders
    //
    // =========================================================

    @PostMapping
    public ResponseEntity<?> createOrder(
            @RequestBody Order order
    ) {

        try {

            System.out.println(
                    "========================================"
            );

            System.out.println(
                    "CREATE ORDER REQUEST"
            );

            System.out.println(
                    "User ID: " + order.getUserId()
            );

            System.out.println(
                    "Payment Method: " + order.getPaymentMethod()
            );

            System.out.println(
                    "Address: " + order.getAddress()
            );

            System.out.println(
                    "Items: "
                            + (
                            order.getItems() != null
                                    ? order.getItems().size()
                                    : 0
                    )
            );

            System.out.println(
                    "========================================"
            );


            // -------------------------------------------------
            // SAVE ORDER
            // -------------------------------------------------

            Order newOrder =
                    orderService.createOrder(order);


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(newOrder);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Order creation failed"
                            )
                    );
        }
    }


    // =========================================================
    // CANCEL ORDER
    // =========================================================

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {

        try {

            String reason =
                    body.getOrDefault(
                            "reason",
                            "Cancelled by customer"
                    );


            Optional<Order> optionalOrder =
                    orderService.cancelOrder(
                            id,
                            reason
                    );


            if (optionalOrder.isPresent()) {

                return ResponseEntity.ok(
                        optionalOrder.get()
                );
            }


            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message", "Order not found"
                            )
                    );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Failed to cancel order"
                            )
                    );
        }
    }
}