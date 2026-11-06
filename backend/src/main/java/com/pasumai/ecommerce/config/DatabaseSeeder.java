package com.pasumai.ecommerce.config;

import com.pasumai.ecommerce.entity.Product;
import com.pasumai.ecommerce.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.UUID;

@Configuration
public class DatabaseSeeder {

    @Bean
    CommandLineRunner initDatabase(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                Product neemOil = new Product();
                neemOil.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));
                neemOil.setName("Organic Neem Oil Spray (Cold Pressed)");
                neemOil.setBrand("Pasumai Uzhavan");
                neemOil.setCategory("Organic Pesticides");
                neemOil.setMrp(new BigDecimal("450.00"));
                neemOil.setSellingPrice(new BigDecimal("360.00"));
                neemOil.setDiscountPercentage(20);
                neemOil.setStockQuantity(150);
                neemOil.setAvailable(true);
                neemOil.setDescription("Pure bio-pesticide designed to control pests, caterpillars, and whiteflies naturally.");
                
                // Set as comma-separated strings for single table
                neemOil.setApplicationCrops("Paddy, Cotton, Vegetables");
                neemOil.setDosages("5ml per liter of water (5ml/L)");
                neemOil.setFeatures("100% Eco-friendly and non-toxic, Extracted using traditional cold-press techniques");

                productRepository.save(neemOil);
            }
        };
    }
}