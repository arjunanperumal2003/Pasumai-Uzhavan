package com.pasumai.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "cart_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(
            name = "user_id",
            nullable = false,
            length = 100
    )
    private String userId;

    @Column(
            name = "product_id",
            nullable = false,
            length = 100
    )
    private String productId;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String brand = "Pasumai Uzhavan";

    @Column(
            name = "selling_price",
            precision = 10,
            scale = 2,
            nullable = false
    )
    private BigDecimal sellingPrice;

    @Column(nullable = false)
    private Integer qty = 1;

    @Column(length = 500)
    private String image;
}