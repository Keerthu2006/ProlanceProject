package com.trigrowth.controller;

import com.trigrowth.dto.AuthDto;
import com.trigrowth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for authentication – register, login, token refresh.
 * All routes are publicly accessible (configured in {@code SecurityConfig}).
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, and token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new user (Owner registration disabled)")
    public ResponseEntity<AuthDto.AuthResponse> register(
            @Valid @RequestBody AuthDto.RegisterRequest request) {
        // Allow owner registration for demo purposes
        // if (request.role() == com.trigrowth.model.Role.ROLE_OWNER) {
        //     throw new IllegalArgumentException("Owner registration is disabled. Please use Google OAuth.");
        // }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }



    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT tokens")
    public ResponseEntity<AuthDto.AuthResponse> login(
            @Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using a refresh token")
    public ResponseEntity<AuthDto.AuthResponse> refresh(
            @Valid @RequestBody AuthDto.RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }
}
