
package com.pasumai.ecommerce.service;

import com.pasumai.ecommerce.entity.WishlistItem;
import com.pasumai.ecommerce.repository.WishlistRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    public WishlistService(WishlistRepository wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    // =========================
    // GET USER WISHLIST
    // =========================

    public List<WishlistItem> getWishlistByUserId(String userId) {
        return wishlistRepository.findByUserId(userId);
    }

    // =========================
    // ADD TO WISHLIST
    // =========================

    public WishlistItem addToWishlist(WishlistItem item) {

        Optional<WishlistItem> existing =
                wishlistRepository.findByUserIdAndProductId(
                        item.getUserId(),
                        item.getProductId()
                );

        // Product already exists
        if (existing.isPresent()) {
            return existing.get();
        }

        // New product
        return wishlistRepository.save(item);
    }

    // =========================
    // REMOVE FROM WISHLIST
    // =========================

    public void removeFromWishlist(
            Integer wishlistItemId,
            String userId) {

        Optional<WishlistItem> item =
                wishlistRepository.findById(wishlistItemId);

        /*
         * Delete only if the wishlist item
         * belongs to the logged-in user.
         */
        if (item.isPresent()
                && userId.equals(item.get().getUserId())) {

            wishlistRepository.deleteById(wishlistItemId);
        }
    }

    // =========================
    // CLEAR USER WISHLIST
    // =========================

    public void clearWishlist(String userId) {
        wishlistRepository.deleteByUserId(userId);
    }
}

