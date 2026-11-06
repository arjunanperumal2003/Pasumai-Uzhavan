package com.pasumai.ecommerce.controller;

import com.pasumai.ecommerce.entity.User;
import com.pasumai.ecommerce.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
        origins = "http://localhost:3000",
        allowCredentials = "true"
)
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // =========================
    // REGISTER
    // =========================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody User user,
            HttpSession session) {

        try {

            User registeredUser =
                    userService.registerUser(user);

            // Do not send password to frontend
            registeredUser.setPassword(null);

            // Create login session
            session.setAttribute(
                    "userId",
                    registeredUser.getId()
            );

            session.setAttribute(
                    "user",
                    registeredUser
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(registeredUser);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> credentials,
            HttpSession session) {

        String email =
                credentials.get("email");

        String password =
                credentials.get("password");

        if (email == null || password == null) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            "Email and password are required"
                    ));
        }

        Optional<User> authenticatedUser =
                userService.authenticateUser(
                        email,
                        password
                );

        if (authenticatedUser.isPresent()) {

            User user =
                    authenticatedUser.get();

            // Store ID in session
            session.setAttribute(
                    "userId",
                    user.getId()
            );

            // Clear password
            user.setPassword(null);

            // Store user in session
            session.setAttribute(
                    "user",
                    user
            );

            return ResponseEntity.ok(user);
        }

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "error",
                        "Invalid credentials"
                ));
    }

    // =========================
    // CURRENT USER
    // =========================

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            HttpSession session) {

        String userId =
                (String) session.getAttribute("userId");

        if (userId == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Not logged in"
                    ));
        }

        Optional<User> user =
                userService.getUserById(userId);

        if (user.isEmpty()) {

            session.invalidate();

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "User not found"
                    ));
        }

        User currentUser = user.get();

        // Never send password
        currentUser.setPassword(null);

        return ResponseEntity.ok(currentUser);
    }

    // =========================
    // LOGOUT
    // =========================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpSession session) {

        session.invalidate();

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Logout successful"
                )
        );
    }
}