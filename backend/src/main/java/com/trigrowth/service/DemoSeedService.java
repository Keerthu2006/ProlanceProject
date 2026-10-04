package com.trigrowth.service;

import com.trigrowth.model.*;
import com.trigrowth.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoSeedService implements ApplicationRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final FreelancerProfileRepository profileRepository;
    private final MessageRepository messageRepository;
    private final ApplicationRepository applicationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedDemoAccounts();
    }

    private void seedDemoAccounts() {
        // --- DEMO CLIENT (triggers Customer Neglect + Revenue Neglect) ---
        if (!userRepository.existsByEmail("demo.client@prolance.ai")) {
            User client = User.builder()
                    .email("demo.client@prolance.ai")
                    .fullName("Alex Morgan (Demo)")
                    .username("demo_client")
                    .password(passwordEncoder.encode("Demo@2026"))
                    .role(Role.ROLE_CLIENT)
                    .active(true)
                    .emailVerified(true)
                    // Last login 35 days ago -> triggers Customer Neglect
                    .lastLoginAt(Instant.now().minus(35, ChronoUnit.DAYS))
                    .build();
            userRepository.save(client);

            // Find or use the admin as owner
            User owner = userRepository.findByEmail("admin@prolance.ai").orElse(null);

            // Create a stalled project
            Project stalledProject = Project.builder()
                    .title("E-Commerce Platform Redesign")
                    .description("Complete redesign of our e-commerce site with modern UI and better checkout flow")
                    .budgetMin(new BigDecimal("2000"))
                    .budgetMax(new BigDecimal("5000"))
                    .status(Project.Status.OPEN)
                    .skillsRequired(List.of("React", "Node.js", "UI/UX"))
                    .durationDays(60)
                    .client(client)
                    .owner(owner)
                    // Posted 40 days ago with no bids
                    .createdAt(Instant.now().minus(40, ChronoUnit.DAYS))
                    .build();
            projectRepository.save(stalledProject);

            log.info("Demo client created: demo.client@prolance.ai / Demo@2026");
        }

        // --- DEMO FREELANCER (triggers Product Neglect + Opportunity Neglect) ---
        if (!userRepository.existsByEmail("demo.freelancer@prolance.ai")) {
            User freelancer = User.builder()
                    .email("demo.freelancer@prolance.ai")
                    .fullName("Sam Rivera (Demo)")
                    .username("demo_freelancer")
                    .password(passwordEncoder.encode("Demo@2026"))
                    .role(Role.ROLE_FREELANCER)
                    .active(true)
                    .emailVerified(true)
                    .lastLoginAt(Instant.now().minus(15, ChronoUnit.DAYS))
                    .build();
            userRepository.save(freelancer);

            // Incomplete profile -> triggers Product Neglect
            FreelancerProfile profile = FreelancerProfile.builder()
                    .user(freelancer)
                    .headline(null)          // Missing headline
                    .bio("I do web dev")     // Too short bio
                    .hourlyRate(null)        // Missing rate
                    .skills(List.of("HTML", "CSS")) // Outdated skills, missing modern ones
                    .aiScore(35.0)           // Low AI score
                    .availability("Part-time")
                    .build();
            profileRepository.save(profile);

            // Find demo client to create a chat with frustrated messages
            User demoClient = userRepository.findByEmail("demo.client@prolance.ai").orElse(null);
            Project stalledProject = projectRepository.findByStatus(Project.Status.OPEN)
                    .stream().filter(p -> p.getTitle().contains("E-Commerce")).findFirst().orElse(null);

            if (demoClient != null && stalledProject != null) {
                // Apply for project
                if (!applicationRepository.existsByProjectIdAndFreelancerId(stalledProject.getId(), freelancer.getId())) {
                    applicationRepository.save(Application.builder()
                            .project(stalledProject)
                            .freelancer(freelancer)
                            .coverLetter("I can help with the redesign")
                            .proposedAmount(new BigDecimal("3500"))
                            .status(Application.Status.PENDING)
                            .appliedAt(Instant.now().minus(10, ChronoUnit.DAYS))
                            .build());
                }

                // Add frustrated chat messages for NLP sentiment analysis
                List<String> frustratedMessages = List.of(
                    "Hello? It's been a week and I haven't heard anything about my project.",
                    "I'm starting to think this platform doesn't care about clients.",
                    "Very disappointed with the lack of communication here.",
                    "I posted my project 40 days ago and still no real progress. This is unacceptable.",
                    "If I don't hear back soon, I'll have to take my business elsewhere."
                );
                Instant msgTime = Instant.now().minus(30, ChronoUnit.DAYS);
                for (String text : frustratedMessages) {
                    if (messageRepository.findByProjectIdOrderBySentAtAsc(stalledProject.getId()).size() < 5) {
                        messageRepository.save(Message.builder()
                                .project(stalledProject)
                                .sender(demoClient)
                                .content(text)
                                .sentAt(msgTime)
                                .read(false)
                                .build());
                        msgTime = msgTime.plus(3, ChronoUnit.DAYS);
                    }
                }
            }

            log.info("Demo freelancer created: demo.freelancer@prolance.ai / Demo@2026");
        }
    }
}
