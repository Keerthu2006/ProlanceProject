with open('src/main/java/com/trigrowth/controller/ProjectController.java', 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = ''.join(lines)
idx = content.rfind('}')

method = """
    @GetMapping("/{id}/ai-matches")
    @Operation(summary = "Get AI semantic matches for a project")
    public ResponseEntity<?> getAiMatches(@PathVariable Long id) {
        Project p = projectService.getProject(id);
        List<Map<String,Object>> freelancers = new java.util.ArrayList<>();
        for(com.trigrowth.model.FreelancerProfile prof : profileRepository.findAll()) {
            freelancers.add(Map.of(
                "id", prof.getUser().getId(),
                "headline", prof.getHeadline() != null ? prof.getHeadline() : "",
                "bio", prof.getBio() != null ? prof.getBio() : "",
                "skills", prof.getSkills() != null ? prof.getSkills() : List.of()
            ));
        }
        Map<String,Object> req = Map.of(
            "project_title", p.getTitle(),
            "project_description", p.getDescription(),
            "project_skills", p.getSkillsRequired(),
            "freelancers", freelancers
        );
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            ResponseEntity<Map> res = restTemplate.postForEntity("http://localhost:8001/match", req, Map.class);
            return ResponseEntity.ok(res.getBody());
        } catch(Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
"""

new_content = content[:idx] + method
with open('src/main/java/com/trigrowth/controller/ProjectController.java', 'w', encoding='utf-8') as f:
    f.write(new_content)
