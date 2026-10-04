import re

with open('backend/src/main/java/com/trigrowth/controller/ProjectController.java', 'r', encoding='utf-8') as f:
    content = f.read()

old_req = """        Map<String,Object> req = Map.of(
            "project_title", p.getTitle(),
            "project_description", p.getDescription(),
            "project_skills", p.getSkillsRequired(),
            "freelancers", freelancers
        );"""

new_req = """        Map<String,Object> req = Map.of(
            "project_title", p.getTitle(),
            "project_description", p.getDescription(),
            "project_skills", p.getSkillsRequired(),
            "project_type", p.getProjectType() != null ? p.getProjectType().name() : "INDIVIDUAL",
            "team_size", p.getTeamSize() != null ? p.getTeamSize() : 1,
            "freelancers", freelancers
        );"""

content = content.replace(old_req, new_req)

with open('backend/src/main/java/com/trigrowth/controller/ProjectController.java', 'w', encoding='utf-8') as f:
    f.write(content)
