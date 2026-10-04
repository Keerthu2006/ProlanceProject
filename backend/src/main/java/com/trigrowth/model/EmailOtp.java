package com.trigrowth.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "email_otps")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class EmailOtp {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false, length = 6)
    private String otp;
    
    @Column(nullable = false)
    private Instant expiresAt;
    
    private boolean used = false;
    
    @Column(nullable = false)
    private Instant createdAt;
}
