package com.trigrowth.repository;

import com.trigrowth.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByProjectId(Long projectId);

    List<Payment> findByStatus(Payment.Status status);

    long countByStatus(Payment.Status status);
}
