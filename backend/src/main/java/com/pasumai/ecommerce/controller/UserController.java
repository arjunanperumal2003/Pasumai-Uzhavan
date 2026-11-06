package com.pasumai.ecommerce.controller;

import com.pasumai.ecommerce.entity.User;
import com.pasumai.ecommerce.repository.UserRepository;
import com.pasumai.ecommerce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    // Delegates to UserService so passwords are always BCrypt-hashed,
    // matching AuthController's /api/auth/register behavior.
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            registeredUser.setPassword(null); // Never return the password hash
            return ResponseEntity.ok(registeredUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Delegates to UserService so the hashed password is compared correctly,
    // matching AuthController's /api/auth/login behavior.
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginReq) {
        Optional<User> userOpt = userService.authenticateUser(loginReq.getEmail(), loginReq.getPassword());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(null);
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}