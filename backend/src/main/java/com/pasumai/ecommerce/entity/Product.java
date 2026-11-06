package com.pasumai.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String brand;
    private String category;
    
    private String image;
    
    @Column(columnDefinition = "TEXT")
    private String about;
    
    @Column(name = "technical_content")
    private String technicalContent;
    
    private String classification;

    @Column(precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "selling_price", precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "discount_percentage")
    private Integer discountPercentage;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @Column(name = "is_available")
    private Boolean available;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Converted to simple strings for a single-table approach
    @Column(name = "application_crops")
    private String applicationCrops;

    private String dosages;

    @Column(columnDefinition = "TEXT")
    private String features;
}