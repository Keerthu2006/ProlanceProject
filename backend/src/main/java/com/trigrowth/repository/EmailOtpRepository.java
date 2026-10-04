package com.trigrowth.repository;

import com.trigrowth.model.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
        String email, Instant now);
    void deleteByEmail(String email);
}
