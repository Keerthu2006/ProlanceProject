package com.trigrowth.security;

import com.trigrowth.model.Role;
import com.trigrowth.model.User;
import com.trigrowth.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * ProLance OAuth2 Success Handler
 * 
 * Role detection priority:
 * 1. "role" query param in the redirect URL (state param passed via frontend)
 * 2. "selected_role" cookie (legacy fallback)
 * 3. Default: ROLE_FREELANCER for new users (existing users keep their role)
 */
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");

        if (email == null) {
            response.sendRedirect("http://localhost:5173/login?error=no_email");
            return;
        }

        // ── 1. Try "role" query param (sent via OAuth2 state / redirect URI) ──
        Role selectedRole = extractRoleFromRequest(request);

        // ── 2. Resolve or create user ──
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Brand-new user — use the selectedRole (default FREELANCER if none)
            Role roleForNew = (selectedRole != null) ? selectedRole : Role.ROLE_FREELANCER;
            user = User.builder()
                    .email(email)
                    .username(generateUsername(email))
                    .fullName(name != null ? name : email.split("@")[0])
                    .password(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                              .encode(UUID.randomUUID().toString()))
                    .role(roleForNew)
                    .active(true)
                    .emailVerified(true)
                    .build();
            user = userRepository.save(user);
        } else if (selectedRole != null && selectedRole != user.getRole()) {
            // Existing user explicitly chose a different role. The requirements say
            // we should not allow the same email for a different role signup.
            response.sendRedirect("http://localhost:5173/login?error=Email%20already%20registered%20with%20a%20different%20role");
            return;
        }

        String jwt = jwtService.generateAccessToken(user);
        String redirectUrl = "http://localhost:5173/auth/oauth2/success?token=" + jwt
                + "&role=" + user.getRole().name();
        response.sendRedirect(redirectUrl);
    }

    /**
     * Extract the desired role from (in order of priority):
     * 1. "role" request parameter
     * 2. "selected_role" cookie
     */
    private Role extractRoleFromRequest(HttpServletRequest request) {
        // Try query param first
        String roleParam = request.getParameter("role");
        if (roleParam != null && !roleParam.isBlank()) {
            try {
                return Role.valueOf(URLDecoder.decode(roleParam.trim(), StandardCharsets.UTF_8));
            } catch (IllegalArgumentException ignored) {}
        }

        // Fallback: cookie (set by frontend before OAuth redirect)
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("selected_role".equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                    try {
                        return Role.valueOf(URLDecoder.decode(cookie.getValue().trim(), StandardCharsets.UTF_8));
                    } catch (IllegalArgumentException ignored) {}
                }
            }
        }
        return null;
    }

    private String generateUsername(String email) {
        String base = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
        return base + "_" + UUID.randomUUID().toString().substring(0, 6);
    }
}
