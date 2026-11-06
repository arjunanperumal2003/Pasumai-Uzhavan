package com.pasumai.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the application.
 * Equivalent of "app.listen(5000, ...)" in index.js — Spring Boot
 * starts an embedded server automatically (default port 8080,
 * changed to 5000 in application.properties to match the original).
 */
@SpringBootApplication
public class EcommerceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcommerceApplication.class, args);
        System.out.println("Server running http://localhost:5000");
    }
}
