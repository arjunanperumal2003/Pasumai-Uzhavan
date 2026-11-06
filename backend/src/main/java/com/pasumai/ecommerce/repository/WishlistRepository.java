package com.pasumai.ecommerce.repository;

import com.pasumai.ecommerce.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Integer> {

    // Get all wishlist items for a user
    List<WishlistItem> findByUserId(String userId);

    // Check whether this product is already in the user's wishlist
    Optional<WishlistItem> findByUserIdAndProductId(
            String userId,
            String productId
    );

    // Clear all wishlist items for a user
    void deleteByUserId(String userId);
}