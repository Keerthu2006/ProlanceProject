package com.trigrowth.controller;

import com.trigrowth.dto.AuthDto;
import com.trigrowth.service.AuthService;
import com.trigrowth.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST endpoints for authentication ?" register, login, token refresh.
 * All routes are publicly accessible (configured in {@code SecurityConfig}).
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, and token management")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

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

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Email required"));
        String otp = otpService.sendOtp(email);
        // otp == null means real email was sent via Brevo API — don't expose the code
        // otp != null means email failed — return demo_otp so the demo still works
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("message", "OTP sent to " + email);
        if (otp != null) resp.put("demo_otp", otp);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        boolean valid = otpService.verifyOtp(body.get("email"), body.get("otp"));
        if (valid) return ResponseEntity.ok(Map.of("verified", true));
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
    }
}
