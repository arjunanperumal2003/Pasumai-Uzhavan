
package com.pasumai.ecommerce.controller;

import com.pasumai.ecommerce.entity.WishlistItem;
import com.pasumai.ecommerce.service.WishlistService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(
    origins = "http://localhost:3000",
    allowCredentials = "true"
)
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    // =========================
    // GET MY WISHLIST
    // =========================

    @GetMapping("/my")
    public ResponseEntity<?> getMyWishlist(
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

        List<WishlistItem> wishlist =
                wishlistService.getWishlistByUserId(
                        userId.toString()
                );

        return ResponseEntity.ok(wishlist);
    }

    // =========================
    // ADD TO WISHLIST
    // =========================

    @PostMapping
    public ResponseEntity<?> addToWishlist(
            @RequestBody WishlistItem item,
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

        // IMPORTANT:
        // Never trust userId sent from frontend.
        item.setUserId(userId.toString());

        // Session wishlist is not needed for logged-in users
        item.setSessionId(null);

        WishlistItem saved =
                wishlistService.addToWishlist(item);

        return ResponseEntity.ok(saved);
    }

    // =========================
    // REMOVE FROM WISHLIST
    // =========================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeFromWishlist(
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

        wishlistService.removeFromWishlist(
                id,
                userId.toString()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Wishlist item removed successfully"
                )
        );
    }

    // =========================
    // CLEAR MY WISHLIST
    // =========================

    @DeleteMapping("/my")
    public ResponseEntity<?> clearWishlist(
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

        wishlistService.clearWishlist(
                userId.toString()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Wishlist cleared successfully"
                )
        );
    }
}

