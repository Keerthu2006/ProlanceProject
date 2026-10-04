import re

with open('backend/src/main/java/com/trigrowth/controller/OwnerController.java', 'r', encoding='utf-8') as f:
    content = f.read()

endpoint = '''
    @PostMapping("/seed-demo")
    public ResponseEntity<String> seedDemoData() {
        // 1. Create User
        User client = userRepository.findByEmail("clientcredmks@gmail.com").orElse(new User());
        client.setEmail("clientcredmks@gmail.com");
        client.setFullName("MKS Client Demo");
        client.setRole(Role.ROLE_CLIENT);
        // "password123" hashed with BCrypt
        client.setPassword("\\\.T2rL3w8N9O1k2sI3u4C5V6v.T7rL8w"); 
        client.setUsername("mksdemo");
        client.setCreatedAt(Instant.now().minus(100, java.time.temporal.ChronoUnit.DAYS));
        client.setLastLoginAt(Instant.now().minus(85, java.time.temporal.ChronoUnit.DAYS));
        userRepository.save(client);

        // 2. Create Open Projects (to trigger Financial Delay & Customer Inactivity)
        for(int i=0; i<6; i++) {
            Project p = new Project();
            p.setClient(client);
            p.setTitle("Abandoned Blockchain Integration " + i);
            p.setCategory("Blockchain");
            p.setStatus(Project.Status.OPEN);
            p.setBudgetMin(java.math.BigDecimal.valueOf(2000));
            p.setBudgetMax(java.math.BigDecimal.valueOf(5000));
            p.setCreatedAt(Instant.now().minus(80, java.time.temporal.ChronoUnit.DAYS));
            p.setDeadline(Instant.now().minus(20, java.time.temporal.ChronoUnit.DAYS));
            projectRepository.save(p);
            
            // Add bad reviews to drop client rating
            if (i < 3) {
                User freelancer = userRepository.findByEmail("john@example.com").orElse(null);
                if (freelancer != null) {
                    Review r = new Review();
                    r.setProject(p);
                    r.setReviewer(freelancer);
                    r.setReviewee(client);
                    r.setRating(1);
                    r.setComment("Terrible experience. Never replied to my messages. Completely abandoned the project.");
                    r.setCreatedAt(Instant.now());
                    reviewRepository.save(r);
                }
            }
        }

        // 3. Drop Revenue for Financial Neglect
        revenueSnapshotRepository.deleteAll();
        RevenueSnapshot s1 = new RevenueSnapshot();
        s1.setMonth("2026-08"); s1.setTotalRevenue(java.math.BigDecimal.valueOf(25000));
        revenueSnapshotRepository.save(s1);
        
        RevenueSnapshot s2 = new RevenueSnapshot();
        s2.setMonth("2026-09"); s2.setTotalRevenue(java.math.BigDecimal.valueOf(3000)); // Huge drop
        revenueSnapshotRepository.save(s2);
        
        return ResponseEntity.ok("Successfully seeded demo data for clientcredmks@gmail.com!");
    }
'''

content = content.replace('public class OwnerController {', 'public class OwnerController {' + endpoint)

with open('backend/src/main/java/com/trigrowth/controller/OwnerController.java', 'w', encoding='utf-8') as f:
    f.write(content)
