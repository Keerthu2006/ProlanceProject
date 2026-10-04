package com.trigrowth.dto;

import com.trigrowth.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTOs for authentication endpoints.
 */
public final class AuthDto {

    private AuthDto() {}

    // ── Requests ─────────────────────────────────────────────

    public record RegisterRequest(
        @NotBlank @Email(message = "Must be a valid email")
        String email,

        @NotBlank @Size(min = 3, max = 50)
        String username,

        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        @NotBlank @Size(max = 150)
        String fullName,

        @NotNull
        Role role
    ) {}

    public record LoginRequest(
        @NotBlank String email,
        @NotBlank String password
    ) {}

    public record RefreshTokenRequest(
        @NotBlank String refreshToken
    ) {}

    // ── Responses ────────────────────────────────────────────

    public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserDto user
    ) {}

    public record UserDto(
        String id,
        String email,
        String username,
        String fullName,
        String role,
        String profileImageUrl
    ) {}
}
