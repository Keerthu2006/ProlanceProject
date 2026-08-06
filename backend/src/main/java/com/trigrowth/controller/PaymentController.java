package com.trigrowth.controller;

import com.trigrowth.model.Payment;
import com.trigrowth.model.User;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment initiation and completion")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    @PostMapping("/initiate")
    public ResponseEntity<Payment> initiate(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody InitiateRequest req) {
        User payer = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return ResponseEntity.status(HttpStatus.CREATED).body(
                paymentService.initiatePayment(req.projectId(), payer.getId(),
                        req.payeeId(), req.amount()));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Payment> complete(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.completePayment(id));
    }

    @GetMapping("/project/{pid}")
    public ResponseEntity<List<Payment>> getByProject(@PathVariable Long pid) {
        return ResponseEntity.ok(paymentService.getPaymentsForProject(pid));
    }

    public record InitiateRequest(
            @NotNull Long projectId,
            @NotNull UUID payeeId,
            @NotNull BigDecimal amount
    ) {}
}
