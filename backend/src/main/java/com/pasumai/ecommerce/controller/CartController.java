
package com.pasumai.ecommerce.controller;

import com.pasumai.ecommerce.entity.CartItem;
import com.pasumai.ecommerce.service.CartService;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(
        origins = "http://localhost:3000",
        allowCredentials = "true"
)
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // =========================
    // GET MY CART
    // =========================

    @GetMapping("/my")
    public ResponseEntity<?> getMyCart(
            HttpSession session) {

        Object userId =
                session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Please login first"
                    ));
        }

        List<CartItem> cart =
                cartService.getCartByUserId(
                        userId.toString()
                );

        return ResponseEntity.ok(cart);
    }

    // =========================
    // ADD TO CART
    // =========================

    @PostMapping
    public ResponseEntity<?> addToCart(
            @RequestBody CartItem item,
            HttpSession session) {

        Object userId =
                session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Please login first"
                    ));
        }

        CartItem savedItem =
                cartService.addToCart(
                        userId.toString(),
                        item
                );

        return ResponseEntity.ok(savedItem);
    }

    // =========================
    // UPDATE QUANTITY
    // =========================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuantity(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {

        Object userId =
                session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Please login first"
                    ));
        }

        Object quantityObject =
                request.get("qty");

        if (quantityObject == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            "Quantity is required"
                    ));
        }

        try {

            Integer quantity =
                    Integer.parseInt(
                            quantityObject.toString()
                    );

            Optional<CartItem> updatedItem =
                    cartService.updateQuantity(
                            id,
                            userId.toString(),
                            quantity
                    );

            if (updatedItem.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error",
                                "Cart item not found"
                        ));
            }

            return ResponseEntity.ok(
                    updatedItem.get()
            );

        } catch (NumberFormatException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            "Invalid quantity"
                    ));
        }
    }

    // =========================
    // REMOVE FROM CART
    // =========================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeFromCart(
            @PathVariable Integer id,
            HttpSession session) {

        Object userId =
                session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Please login first"
                    ));
        }

        boolean removed =
                cartService.removeFromCart(
                        id,
                        userId.toString()
                );

        if (!removed) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            "Cart item not found"
                    ));
        }

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Item removed from cart"
                )
        );
    }

    // =========================
    // CLEAR MY CART
    // =========================

    @DeleteMapping("/my")
    public ResponseEntity<?> clearMyCart(
            HttpSession session) {

        Object userId =
                session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Please login first"
                    ));
        }

        cartService.clearUserCart(
                userId.toString()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Cart cleared successfully"
                )
        );
    }
}

