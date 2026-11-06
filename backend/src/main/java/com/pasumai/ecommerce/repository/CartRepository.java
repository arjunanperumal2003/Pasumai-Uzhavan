
package com.pasumai.ecommerce.repository;

import com.pasumai.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartRepository
        extends JpaRepository<CartItem, Integer> {

    // Get all cart items for a user
    List<CartItem> findByUserId(String userId);

    // Find a particular product in user's cart
    Optional<CartItem> findByUserIdAndProductId(
            String userId,
            String productId
    );

    // Delete all cart items for a user
    void deleteByUserId(String userId);
}
