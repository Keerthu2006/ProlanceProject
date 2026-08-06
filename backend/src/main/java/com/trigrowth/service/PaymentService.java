package com.trigrowth.service;

import com.trigrowth.model.Payment;
import com.trigrowth.model.Project;
import com.trigrowth.model.RevenueSnapshot;
import com.trigrowth.model.User;
import com.trigrowth.repository.PaymentRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.RevenueSnapshotRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository         paymentRepository;
    private final ProjectRepository         projectRepository;
    private final UserRepository            userRepository;
    private final RevenueSnapshotRepository revenueSnapshotRepository;

    public Payment initiatePayment(Long projectId, UUID payerId, UUID payeeId, BigDecimal amount) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
        User payer = userRepository.findById(payerId)
                .orElseThrow(() -> new IllegalArgumentException("Payer not found"));
        User payee = userRepository.findById(payeeId)
                .orElseThrow(() -> new IllegalArgumentException("Payee not found"));

        Payment payment = Payment.builder()
                .project(project)
                .payer(payer)
                .payee(payee)
                .amount(amount)
                .status(Payment.Status.PENDING)
                .createdAt(Instant.now())
                .build();

        return paymentRepository.save(payment);
    }

    public Payment completePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        payment.setStatus(Payment.Status.COMPLETED);
        payment.setCompletedAt(Instant.now());
        paymentRepository.save(payment);

        // Update monthly revenue snapshot
        updateRevenueSnapshot(payment.getAmount());

        return payment;
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsForProject(Long projectId) {
        return paymentRepository.findByProjectId(projectId);
    }

    // ── helpers ──────────────────────────────────────────────────

    private void updateRevenueSnapshot(BigDecimal amount) {
        String month = YearMonth.now().toString(); // e.g. "2024-07"
        RevenueSnapshot snapshot = revenueSnapshotRepository.findByMonth(month)
                .orElseGet(() -> RevenueSnapshot.builder()
                        .month(month)
                        .totalRevenue(BigDecimal.ZERO)
                        .contractCount(0)
                        .avgContractValue(BigDecimal.ZERO)
                        .createdAt(Instant.now())
                        .build());

        snapshot.setTotalRevenue(snapshot.getTotalRevenue().add(amount));
        snapshot.setContractCount(snapshot.getContractCount() + 1);
        if (snapshot.getContractCount() > 0) {
            snapshot.setAvgContractValue(
                    snapshot.getTotalRevenue().divide(
                            BigDecimal.valueOf(snapshot.getContractCount()), 2,
                            java.math.RoundingMode.HALF_UP));
        }
        revenueSnapshotRepository.save(snapshot);
    }
}
