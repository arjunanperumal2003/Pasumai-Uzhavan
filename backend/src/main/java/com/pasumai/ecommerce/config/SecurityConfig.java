package com.pasumai.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // =========================
    // PASSWORD ENCODER
    // =========================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =========================
    // SECURITY CONFIGURATION
    // =========================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                // =========================
                // ENABLE CORS
                // Uses CorsConfig.java
                // =========================

                .cors(cors -> {
                })


                // =========================
                // DISABLE CSRF
                // =========================

                .csrf(csrf -> csrf.disable())


                // =========================
                // ALLOW REQUESTS
                // Authentication is handled
                // using HttpSession in controllers
                // =========================

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/api/auth/**",
                                "/api/products/**",
                                "/uploads/**"
                        )
                        .permitAll()

                        .anyRequest()
                        .permitAll()
                )


                // =========================
                // SESSION MANAGEMENT
                // =========================

                .sessionManagement(session -> session

                        // Create a session only
                        // when HttpSession is required
                        .sessionCreationPolicy(
                                SessionCreationPolicy.IF_REQUIRED
                        )
                );

        return http.build();
    }
}