
package com.pasumai.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(length = 24)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 15)
    private String mobile;

    @Column(length = 50)
    private String country = "India";

    @Column(length = 100)
    private String state = "Tamil Nadu";

    @Column(length = 100)
    private String district;

    @Column(length = 10)
    private String pincode;

    @Column(length = 255)
    private String landmark;

    @Column(name = "farm_size", precision = 8, scale = 2)
    private BigDecimal farmSize;

    @Column(length = 20)
    private String role = "USER";

    @Column(
        name = "created_at",
        insertable = false,
        updatable = false
    )
    private LocalDateTime createdAt;
}
