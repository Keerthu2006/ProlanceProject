package com.trigrowth.service;

import com.trigrowth.dto.AuthDto;
import com.trigrowth.model.User;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Handles user registration, login, and token refresh.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use: " + request.email());
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already taken: " + request.username());
        }

        User user = User.builder()
                .email(request.email())
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(request.role())
                .build();

        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid email or password");
        }

        return buildAuthResponse(user);
    }

    public AuthDto.AuthResponse refreshToken(AuthDto.RefreshTokenRequest request) {
        String username = jwtService.extractUsername(request.refreshToken());
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!jwtService.isTokenValid(request.refreshToken(), user)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        return buildAuthResponse(user);
    }

    // ── Helpers ───────────────────────────────────────────────

    private AuthDto.AuthResponse buildAuthResponse(User user) {
        Map<String, Object> extraClaims = Map.of("role", user.getRole().name());
        String accessToken  = jwtService.generateAccessToken(extraClaims, user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                toUserDto(user)
        );
    }

    private AuthDto.UserDto toUserDto(User user) {
        return new AuthDto.UserDto(
                user.getId().toString(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().name(),
                user.getProfileImageUrl()
        );
    }
}
