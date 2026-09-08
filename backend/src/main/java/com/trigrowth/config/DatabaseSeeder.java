package com.trigrowth.config;

import com.trigrowth.model.*;
import com.trigrowth.model.Project.Status;
import com.trigrowth.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final FreelancerProfileRepository profileRepository;
    private final TeamRepository teamRepository;
    private final RevenueSnapshotRepository revenueSnapshotRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.countByRole(Role.ROLE_FREELANCER) > 0) {
            return; // Already seeded
        }

        System.out.println("Seeding AI Training Database scenarios...");

        Random random = new Random(42);

        // 1. Generate Clients
        List<User> clients = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            User client = userRepository.save(User.builder()
                    .email("client" + i + "@example.com")
                    .username("client" + i)
                    .password(passwordEncoder.encode("password"))
                    .fullName("Client " + i)
                    .emailVerified(true)
                    .role(Role.ROLE_CLIENT)
                    .build());
            clients.add(client);
            
            // Customer Neglect: Make ~60% of clients inactive
            if (random.nextDouble() > 0.4) {
                int daysInactive = 40 + random.nextInt(60);
                jdbcTemplate.update("UPDATE users SET last_login_at = ?, created_at = ? WHERE id = ?",
                        java.sql.Timestamp.from(Instant.now().minus(daysInactive, ChronoUnit.DAYS)),
                        java.sql.Timestamp.from(Instant.now().minus(daysInactive + 10, ChronoUnit.DAYS)),
                        client.getId());
            }
        }

        // 2. Generate Freelancers
        List<User> freelancers = new ArrayList<>();
        String[] possibleSkills = {"React", "Node.js", "AI Agent Development", "Python", "Java", "Spring Boot", "Design", "Data Science"};
        for (int i = 1; i <= 100; i++) {
            User freelancer = userRepository.save(User.builder()
                    .email("freelancer" + i + "@example.com")
                    .username("freelancer" + i)
                    .password(passwordEncoder.encode("password"))
                    .fullName("Freelancer " + i)
                    .emailVerified(true)
                    .role(Role.ROLE_FREELANCER)
                    .build());
            freelancers.add(freelancer);

            int numSkills = 1 + random.nextInt(3);
            List<String> freelancerSkills = new ArrayList<>();
            for (int j = 0; j < numSkills; j++) {
                freelancerSkills.add(possibleSkills[random.nextInt(possibleSkills.length)]);
            }

            profileRepository.save(FreelancerProfile.builder()
                    .user(freelancer)
                    .headline("Expert in " + freelancerSkills.get(0))
                    .hourlyRate(new BigDecimal(30 + random.nextInt(120)))
                    .skills(freelancerSkills)
                    .build());
        }

        // 3. Product Neglect (Low Team Adoption)
        Team team1 = teamRepository.save(Team.builder()
                .name("Alpha Devs")
                .leader(freelancers.get(0))
                .build());

        // 4. Generate Projects (Opportunity Cost Simulation)
        List<Project> projects = new ArrayList<>();
        for (int i = 1; i <= 60; i++) {
            User owner = clients.get(random.nextInt(clients.size()));
            List<String> reqSkills = List.of(possibleSkills[random.nextInt(possibleSkills.length)], "Python");
            Project p = projectRepository.save(Project.builder()
                    .owner(owner)
                    .client(owner)
                    .title("Project " + i)
                    .description("We need an expert to help with our project.")
                    .budgetMin(new BigDecimal(1000 + random.nextInt(5000)))
                    .budgetMax(new BigDecimal(6000 + random.nextInt(15000)))
                    .durationDays(15 + random.nextInt(45))
                    .skillsRequired(reqSkills)
                    .status(random.nextDouble() > 0.3 ? Status.OPEN : Status.COMPLETED)
                    .build());
            
            // Randomly push project creation date to the past so it doesn't inflate the 30d activity score
            int daysOld = 10 + random.nextInt(100);
            jdbcTemplate.update("UPDATE projects SET created_at = ? WHERE id = ?",
                    java.sql.Timestamp.from(Instant.now().minus(daysOld, ChronoUnit.DAYS)), p.getId());
            projects.add(p);
        }

        // 5. Generate Realistic Reviews (User Feedback for AI)
        String[] positiveFeedback = {
            "Great work, delivered on time.",
            "Very professional and communicative.",
            "Excellent job, will hire again.",
            "Exceeded expectations.",
            "Fast delivery and high quality."
        };
        String[] negativeFeedback = {
            "Communication was poor.",
            "Missed the deadline.",
            "I was completely unaware you could hire entire teams here. I couldn't find the team formation feature anywhere.",
            "Decent platform, but there's no guidance on how freelancers can group up into teams. Seems like a missing feature.",
            "Billing process is confusing. I was overcharged initially.",
            "The project tracking tools are very limited.",
            "Freelancer stopped responding for a week.",
            "Hard to find people with the right AI skills on this platform."
        };

        for (int i = 0; i < 80; i++) {
            Project proj = projects.get(random.nextInt(projects.size()));
            User reviewer = proj.getClient();
            User reviewee = freelancers.get(random.nextInt(freelancers.size()));
            
            boolean isPositive = random.nextDouble() > 0.4;
            int rating = isPositive ? (4 + random.nextInt(2)) : (1 + random.nextInt(3));
            String comment = isPositive 
                ? positiveFeedback[random.nextInt(positiveFeedback.length)] 
                : negativeFeedback[random.nextInt(negativeFeedback.length)];

            reviewRepository.save(Review.builder()
                    .project(proj)
                    .reviewer(reviewer)
                    .reviewee(reviewee)
                    .rating(rating)
                    .comment(comment)
                    .build());
        }

        // 6. Financial Neglect (Revenue drop)
        YearMonth currentMonth = YearMonth.now(ZoneId.of("UTC"));
        YearMonth previousMonth = currentMonth.minusMonths(1);

        revenueSnapshotRepository.save(RevenueSnapshot.builder()
                .month(previousMonth.toString())
                .totalRevenue(new BigDecimal("136363.00"))
                .contractCount(50)
                .build());

        revenueSnapshotRepository.save(RevenueSnapshot.builder()
                .month(currentMonth.toString())
                .totalRevenue(new BigDecimal("120000.00")) // ~12% drop
                .contractCount(42)
                .build());

        System.out.println("Database seeded with Kaggle-Style AI Training Scenarios successfully!");
    }
}
