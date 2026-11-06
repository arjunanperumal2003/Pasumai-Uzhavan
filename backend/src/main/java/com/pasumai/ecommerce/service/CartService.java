
package com.pasumai.ecommerce.service;

import com.pasumai.ecommerce.entity.CartItem;
import com.pasumai.ecommerce.repository.CartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    private final CartRepository cartRepository;

    public CartService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    // =========================
    // GET USER CART
    // =========================

    public List<CartItem> getCartByUserId(String userId) {
        return cartRepository.findByUserId(userId);
    }

    // =========================
    // ADD TO CART
    // =========================

    public CartItem addToCart(
            String userId,
            CartItem item) {

        Optional<CartItem> existingItem =
                cartRepository.findByUserIdAndProductId(
                        userId,
                        item.getProductId()
                );

        // Product already exists
        if (existingItem.isPresent()) {

            CartItem existing =
                    existingItem.get();

            int currentQty =
                    existing.getQty() == null
                            ? 0
                            : existing.getQty();

            int newQty =
                    item.getQty() == null ||
                    item.getQty() <= 0
                            ? 1
                            : item.getQty();

            existing.setQty(
                    currentQty + newQty
            );

            return cartRepository.save(
                    existing
            );
        }

        // New product
        item.setUserId(userId);

        if (item.getQty() == null ||
                item.getQty() <= 0) {

            item.setQty(1);
        }

        return cartRepository.save(item);
    }

    // =========================
    // UPDATE QUANTITY
    // =========================

    public Optional<CartItem> updateQuantity(
            Integer cartItemId,
            String userId,
            Integer quantity) {

        Optional<CartItem> itemOptional =
                cartRepository.findById(
                        cartItemId
                );

        if (itemOptional.isEmpty()) {
            return Optional.empty();
        }

        CartItem item =
                itemOptional.get();

        // Make sure this cart item
        // belongs to the logged-in user
        if (!userId.equals(
                item.getUserId())) {

            return Optional.empty();
        }

        if (quantity == null ||
                quantity < 1) {

            quantity = 1;
        }

        item.setQty(quantity);

        return Optional.of(
                cartRepository.save(item)
        );
    }

    // =========================
    // REMOVE FROM CART
    // =========================

    public boolean removeFromCart(
            Integer cartItemId,
            String userId) {

        Optional<CartItem> itemOptional =
                cartRepository.findById(
                        cartItemId
                );

        if (itemOptional.isEmpty()) {
            return false;
        }

        CartItem item =
                itemOptional.get();

        // User can only delete
        // their own cart item
        if (!userId.equals(
                item.getUserId())) {

            return false;
        }

        cartRepository.deleteById(
                cartItemId
        );

        return true;
    }

    // =========================
    // CLEAR USER CART
    // =========================

    @Transactional
    public void clearUserCart(
            String userId) {

        cartRepository.deleteByUserId(
                userId
        );
    }
}

