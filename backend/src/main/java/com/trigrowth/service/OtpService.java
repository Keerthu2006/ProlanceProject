package com.trigrowth.service;

import com.trigrowth.model.EmailOtp;
import com.trigrowth.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Random;

/**
 * OtpService — sends real OTP emails via Brevo HTTP API (port 443, never blocked by firewalls).
 * Falls back gracefully and returns demo_otp if the API call fails.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OtpService {

    private final EmailOtpRepository otpRepository;
    private final RestTemplate restTemplate;
    private final JavaMailSender mailSender;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender-email:noreply@prolance.ai}")
    private String senderEmail;

    @Value("${brevo.sender-name:ProLance}")
    private String senderName;

    public String sendOtp(String email) {
        // Remove old OTPs for this email
        otpRepository.deleteByEmail(email);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save to DB
        otpRepository.save(EmailOtp.builder()
                .email(email)
                .otp(otp)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(false)
                .createdAt(Instant.now())
                .build());

        // For demo accounts, do not send real email, just return the demo OTP
        if (email.endsWith("@prolance.ai")) {
            log.info("Demo account detected, skipping Brevo email. OTP: {}", otp);
            return otp;
        }

        // Send via JavaMailSender (Gmail SMTP)
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("adminprolance@gmail.com");
            helper.setTo(email);
            helper.setSubject("Your ProLance Verification Code");
            
            String htmlBody = "<div style='font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#0D0A07;color:#FFDBBB;border-radius:12px'><h2 style='color:#997E67'>ProLance Verification</h2><p>Your 6-digit verification code is:</p><div style='font-size:36px;font-weight:bold;letter-spacing:10px;padding:20px;background:#1a1208;border:2px solid #997E67;border-radius:8px;text-align:center;color:#FFDBBB'>" + otp + "</div><p style='color:#997E67;font-size:12px'>This code expires in 10 minutes. Do not share it with anyone.</p></div>";
            
            helper.setText(htmlBody, true);
            mailSender.send(message);
            
            log.info("OTP email sent to {} via Gmail SMTP", email);
            return null; // null = real email sent, no demo_otp needed
        } catch (Exception e) {
            log.warn("Gmail SMTP email failed for {} (OTP: {}): {}", email, otp, e.getMessage());
        }
        
        // Return OTP for demo display if real email could not be sent
        return otp;
    }



    public boolean verifyOtp(String email, String otp) {
        return otpRepository
                .findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, Instant.now())
                .map(stored -> {
                    if (stored.getOtp().equals(otp)) {
                        stored.setUsed(true);
                        otpRepository.save(stored);
                        return true;
                    }
                    return false;
                })
                .orElse(false);
    }

    public String getLatestOtpForOwnerView(String email) {
        return otpRepository
                .findTopByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, Instant.now())
                .map(EmailOtp::getOtp)
                .orElse(null);
    }
}
