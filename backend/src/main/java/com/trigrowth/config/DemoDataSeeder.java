package com.trigrowth.config;

import com.trigrowth.dto.AuthDto;
import com.trigrowth.model.Role;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.MessageRepository;
import com.trigrowth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
@RequiredArgsConstructor
@org.springframework.core.annotation.Order(1)
public class DemoDataSeeder {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final com.trigrowth.repository.ProjectRepository projectRepository;
    private final com.trigrowth.repository.MessageRepository messageRepository;

    @Bean
    public CommandLineRunner seedDatabase() {
        return args -> {
            if (!userRepository.existsByEmail("admin@prolance.ai")) {
                log.info("Seeding demo admin account...");
                AuthDto.RegisterRequest req = new AuthDto.RegisterRequest(
                        "admin@prolance.ai",
                        "admin",
                        "admin123",
                        "System Admin",
                        Role.ROLE_OWNER
                );
                authService.register(req);
                log.info("Demo admin account created: admin@prolance.ai / admin123");
            }
            
            // Inject the user's specific gmail account as a neglected client
            if (!userRepository.existsByEmail("juliealbert852@gmail.com")) {
                log.info("Seeding juliealbert852@gmail.com as a NEGLECTED client...");
                AuthDto.RegisterRequest req = new AuthDto.RegisterRequest(
                        "juliealbert852@gmail.com",
                        "juliealbert",
                        "password123",
                        "Julie Albert",
                        Role.ROLE_CLIENT
                );
                authService.register(req);
                
                // Now time-travel this user 45 days into the past to trigger the Neglect AI
                java.util.Optional<com.trigrowth.model.User> julieOpt = userRepository.findByEmail("juliealbert852@gmail.com");
                if (julieOpt.isPresent()) {
                    com.trigrowth.model.User julie = julieOpt.get();
                    julie.setCreatedAt(java.time.Instant.now().minus(50, java.time.temporal.ChronoUnit.DAYS));
                    julie.setLastLoginAt(java.time.Instant.now().minus(45, java.time.temporal.ChronoUnit.DAYS));
                    userRepository.save(julie);
                    log.info("Successfully time-traveled juliealbert852@gmail.com to 45 days inactive.");
                }
                
                // --- Inject Freelancer Ghosting Scenario ---
                log.info("Seeding Ghosting Freelancer...");
                AuthDto.RegisterRequest flReq = new AuthDto.RegisterRequest(
                        "ghost@example.com", "ghost_freelancer", "password123", "Ghost Freelancer", Role.ROLE_FREELANCER
                );
                authService.register(flReq);
                com.trigrowth.model.User ghost = userRepository.findByEmail("ghost@example.com").get();
                
                // Create a project owned by Julie, assigned to Ghost
                com.trigrowth.model.User julie = userRepository.findByEmail("juliealbert852@gmail.com").get();
                com.trigrowth.model.Project p = com.trigrowth.model.Project.builder()
                        .owner(julie)
                        .client(julie)
                        .hiredFreelancerId(ghost.getId())
                        .title("Urgent Frontend Fixes").durationDays(30)
                        .status(com.trigrowth.model.Project.Status.IN_PROGRESS)
                        .createdAt(java.time.Instant.now().minus(10, java.time.temporal.ChronoUnit.DAYS))
                        .build();
                projectRepository.save(p);
                
                // Create unread messages sent by Julie to Ghost 4 days ago
                com.trigrowth.model.Message m1 = com.trigrowth.model.Message.builder()
                        .project(p)
                        .sender(julie)
                        .content("Hey, are you going to start on this today?")
                        .read(false)
                        .sentAt(java.time.Instant.now().minus(4, java.time.temporal.ChronoUnit.DAYS))
                        .build();
                com.trigrowth.model.Message m2 = com.trigrowth.model.Message.builder()
                        .project(p)
                        .sender(julie)
                        .content("Hello?? We are falling behind schedule.")
                        .read(false)
                        .sentAt(java.time.Instant.now().minus(3, java.time.temporal.ChronoUnit.DAYS))
                        .build();
                messageRepository.saveAll(java.util.List.of(m1, m2));

            }
        };
    }
}