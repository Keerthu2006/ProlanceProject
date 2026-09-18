package com.trigrowth.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.trigrowth.model.Payment;
import com.trigrowth.model.Project;
import com.trigrowth.repository.PaymentRepository;
import com.trigrowth.repository.ProjectRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeService {

    @Value("${stripe.secret-key:sk_test_placeholder}")
    private String stripeSecretKey;

    @Value("${stripe.success-url:http://localhost:5173/dashboard/client}")
    private String successUrl;

    @Value("${stripe.cancel-url:http://localhost:5173/dashboard/client}")
    private String cancelUrl;

    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        log.info("Stripe initialized (key prefix: {})", stripeSecretKey.substring(0, Math.min(10, stripeSecretKey.length())));
    }

    /**
     * Creates a Stripe Checkout session for escrow payment.
     * Returns the checkout URL to redirect the client to.
     */
    public String createCheckoutSession(Long projectId, UUID payerId, UUID payeeId, BigDecimal amount) throws StripeException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?payment=success&project=" + projectId)
                .setCancelUrl(cancelUrl + "?payment=cancelled&project=" + projectId)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(amountInCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Escrow Payment: " + project.getTitle())
                                                                .setDescription("Secure escrow for project ID " + projectId + ". Funds released on completion.")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .putMetadata("projectId", String.valueOf(projectId))
                .putMetadata("payerId", payerId.toString())
                .putMetadata("payeeId", payeeId.toString())
                .putMetadata("amount", amount.toString())
                .build();

        Session session = Session.create(params);
        log.info("Stripe checkout session created: {} for project {}", session.getId(), projectId);
        return session.getUrl();
    }

    /**
     * Simulates escrow release (used when client approves completion).
     * In production this would use Stripe Transfers API.
     */
    public void releaseEscrow(Long paymentId) {
        paymentRepository.findById(paymentId).ifPresent(payment -> {
            payment.setStatus(Payment.Status.COMPLETED);
            payment.setCompletedAt(Instant.now());
            paymentRepository.save(payment);
            log.info("Escrow released for payment {}", paymentId);
        });
    }
}
