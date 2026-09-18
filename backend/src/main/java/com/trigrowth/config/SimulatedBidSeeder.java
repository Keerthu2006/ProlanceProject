package com.trigrowth.config;

import com.trigrowth.model.Application;
import com.trigrowth.model.Project;
import com.trigrowth.model.User;
import com.trigrowth.repository.ApplicationRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.Instant;

@Configuration
@RequiredArgsConstructor
public class SimulatedBidSeeder {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    @Bean
    public CommandLineRunner seedSimulatedBid() {
        return args -> {
            try {
                // Find Project 161 and Freelancer 93
                Project p = projectRepository.findById(161L).orElse(null);
                User f = userRepository.findByEmail("freelancer93@example.com").orElse(null);
                
                if (p != null && f != null) {
                    // Check if bid already exists
                    if (!applicationRepository.existsByProjectIdAndFreelancerId(p.getId(), f.getId())) {
                        Application app = new Application();
                        app.setProject(p);
                        app.setFreelancer(f);
                        app.setCoverLetter("Hi Julie! I am Freelancer 93 and I saw your AI recommendation. I have strong skills in Java, React, and Node.js. I would love to build this E commerce website for you.");
                        app.setProposedAmount(BigDecimal.valueOf(1500));
                        app.setStatus(Application.Status.PENDING);
                        app.setAppliedAt(Instant.now());
                        applicationRepository.save(app);
                        System.out.println(">>> SUCCESSFULLY SIMULATED BID FOR PROJECT 161 BY FREELANCER 93 <<<");
                    }
                }
            } catch (Exception e) {
                System.out.println("Error simulating bid: " + e.getMessage());
            }
        };
    }
}
