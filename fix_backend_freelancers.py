import re

with open('backend/src/main/java/com/trigrowth/controller/ProjectController.java', 'r', encoding='utf-8') as f:
    content = f.read()

old_freelancers = """        for(com.trigrowth.model.FreelancerProfile prof : profileRepository.findAll()) {
            freelancers.add(Map.of(
                "id", prof.getUser().getId(),
                "headline", prof.getHeadline() != null ? prof.getHeadline() : "",
                "bio", prof.getBio() != null ? prof.getBio() : "",
                "skills", prof.getSkills() != null ? prof.getSkills() : List.of()
            ));
        }

        // --- ADDED MOCK DATA FOR DEMO IF EMPTY ---
        if (freelancers.isEmpty()) {
            freelancers.add(Map.of("id", "101", "headline", "Senior React Developer", "bio", "I build fast and scalable web apps using React and Node.", "skills", List.of("React", "Node.js", "TypeScript")));
            freelancers.add(Map.of("id", "102", "headline", "AI/ML Engineer", "bio", "Expert in Python, PyTorch, and deploying LLMs.", "skills", List.of("Python", "AI/ML", "PyTorch", "NLP")));
            freelancers.add(Map.of("id", "103", "headline", "Full Stack Developer", "bio", "Experienced in Java Spring Boot and React.", "skills", List.of("Java", "Spring Boot", "React", "PostgreSQL")));
        }"""

new_freelancers = """        for(com.trigrowth.model.FreelancerProfile prof : profileRepository.findAll()) {
            freelancers.add(Map.of(
                "id", prof.getUser().getId().toString(),
                "name", prof.getUser().getFullName(),
                "hourly_rate", prof.getHourlyRate() != null ? prof.getHourlyRate().doubleValue() : 0.0,
                "headline", prof.getHeadline() != null ? prof.getHeadline() : "",
                "bio", prof.getBio() != null ? prof.getBio() : "",
                "skills", prof.getSkills() != null ? prof.getSkills() : List.of()
            ));
        }

        // --- ADDED MOCK DATA FOR DEMO IF EMPTY ---
        if (freelancers.isEmpty()) {
            freelancers.add(Map.of("id", "101", "name", "Alice Dev", "hourly_rate", 55.0, "headline", "Senior React Developer", "bio", "I build fast and scalable web apps using React and Node.", "skills", List.of("React", "Node.js", "TypeScript")));
            freelancers.add(Map.of("id", "102", "name", "Bob AI", "hourly_rate", 70.0, "headline", "AI/ML Engineer", "bio", "Expert in Python, PyTorch, and deploying LLMs.", "skills", List.of("Python", "AI/ML", "PyTorch", "NLP")));
            freelancers.add(Map.of("id", "103", "name", "Charlie Fullstack", "hourly_rate", 45.0, "headline", "Full Stack Developer", "bio", "Experienced in Java Spring Boot and React.", "skills", List.of("Java", "Spring Boot", "React", "PostgreSQL")));
        }"""

content = content.replace(old_freelancers, new_freelancers)

with open('backend/src/main/java/com/trigrowth/controller/ProjectController.java', 'w', encoding='utf-8') as f:
    f.write(content)
