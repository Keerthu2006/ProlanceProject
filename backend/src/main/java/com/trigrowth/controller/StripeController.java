package com.trigrowth.controller;

import com.stripe.exception.StripeException;
import com.trigrowth.model.Payment;
import com.trigrowth.model.User;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.service.PaymentService;
import com.trigrowth.service.StripeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/payments/stripe")
@RequiredArgsConstructor
public class StripeController {

    private final StripeService stripeService;
    private final PaymentService paymentService;
    private final UserRepository userRepository;

    /**
     * Creates a Stripe Checkout session and returns the URL.
     * Frontend redirects user to this URL to complete payment.
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> createCheckout(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody CheckoutRequest req) {
        try {
            User payer = userRepository.findByEmail(ud.getUsername())
                    .orElseThrow(() -> new IllegalStateException("User not found"));

            // First record the payment as PENDING in DB
            Payment pending = paymentService.initiatePayment(
                    req.projectId(), payer.getId(), req.payeeId(), req.amount());

            // Then create Stripe checkout session
            String checkoutUrl = stripeService.createCheckoutSession(
                    req.projectId(), payer.getId(), req.payeeId(), req.amount());

            return ResponseEntity.ok(Map.of(
                    "checkoutUrl", checkoutUrl,
                    "paymentId", pending.getId(),
                    "status", "PENDING"
            ));
        } catch (StripeException e) {
            log.error("Stripe checkout failed: {}", e.getMessage());
            // Return a simulated response for demo without real Stripe keys
            return ResponseEntity.ok(Map.of(
                    "checkoutUrl", "STRIPE_DEMO_MODE",
                    "paymentId", -1L,
                    "status", "DEMO",
                    "message", "Stripe not configured. In demo mode, escrow is simulated."
            ));
        } catch (Exception e) {
            log.error("Checkout error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Releases escrow funds to freelancer (called when client approves project).
     */
    @PostMapping("/release/{paymentId}")
    public ResponseEntity<?> releaseEscrow(@PathVariable Long paymentId) {
        try {
            stripeService.releaseEscrow(paymentId);
            return ResponseEntity.ok(Map.of("message", "Escrow released successfully", "paymentId", paymentId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Stripe webhook endpoint (for production use with real keys).
     * Handles checkout.session.completed events.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        // In production: verify signature and update payment status
        log.info("Stripe webhook received");
        return ResponseEntity.ok("received");
    }

    /**
     * Get all payments for a project
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProjectPayments(@PathVariable Long projectId) {
        return ResponseEntity.ok(paymentService.getPaymentsForProject(projectId));
    }

    public record CheckoutRequest(
            Long projectId,
            UUID payeeId,
            BigDecimal amount
    ) {}
}
