
package com.pasumai.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    // =========================================================
    // ORDER ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;


    // =========================================================
    // USER ID
    // =========================================================

    @Column(
            name = "user_id",
            nullable = false,
            length = 36
    )
    private String userId;


    // =========================================================
    // TOTAL AMOUNT
    // =========================================================

    @Column(
            name = "total_amount",
            precision = 10,
            scale = 2,
            nullable = false
    )
    private BigDecimal totalAmount;


    // =========================================================
    // PAYMENT METHOD
    // =========================================================

    @Column(
            name = "payment_method",
            nullable = false,
            length = 50
    )
    private String paymentMethod;


    // =========================================================
    // DELIVERY ADDRESS
    // =========================================================

    @Column(
            columnDefinition = "TEXT",
            nullable = false
    )
    private String address;


    // =========================================================
    // ORDER STATUS
    // =========================================================

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private OrderStatus status = OrderStatus.Placed;


    // =========================================================
    // CANCEL REASON
    // =========================================================

    @Column(
            name = "cancel_reason",
            columnDefinition = "TEXT"
    )
    private String cancelReason;


    // =========================================================
    // ORDER ITEMS
    // =========================================================
    //
    // One Order can contain many OrderItems.
    //
    // Example:
    //
    // Order #123
    //     ├── Urea       Qty 2
    //     ├── Neem Oil   Qty 1
    //     └── DAP        Qty 3
    //
    // =========================================================

    @OneToMany(
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JoinColumn(name = "order_id")
    private List<OrderItem> items = new ArrayList<>();


    // =========================================================
    // CREATED DATE
    // =========================================================

    @Column(
            name = "created_at",
            insertable = false,
            updatable = false
    )
    private LocalDateTime createdAt;


    // =========================================================
    // ORDER STATUS ENUM
    // =========================================================

    public enum OrderStatus {

        Placed,
        Processing,
        Delivered,
        Cancelled
    }
}

