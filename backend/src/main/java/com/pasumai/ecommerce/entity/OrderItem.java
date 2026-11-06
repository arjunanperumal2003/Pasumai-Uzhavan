
package com.pasumai.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    // =========================================================
    // ORDER ITEM ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    // =========================================================
    // PRODUCT ID
    // =========================================================

    @Column(
            name = "product_id",
            nullable = false,
            length = 36
    )
    private String productId;


    // =========================================================
    // PRODUCT NAME
    // =========================================================

    @Column(
            nullable = false,
            length = 255
    )
    private String name;


    // =========================================================
    // QUANTITY
    // =========================================================

    @Column(
            nullable = false
    )
    private Integer qty = 1;


    // =========================================================
    // SELLING PRICE
    // =========================================================

    @Column(
            name = "selling_price",
            precision = 10,
            scale = 2,
            nullable = false
    )
    private BigDecimal sellingPrice;


    // =========================================================
    // PRODUCT IMAGE
    // =========================================================

    @Column(
            columnDefinition = "TEXT"
    )
    private String image;
}

