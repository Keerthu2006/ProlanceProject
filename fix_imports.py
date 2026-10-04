with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import com.trigrowth.repository.RecommendationRepository;', 'import com.trigrowth.repository.RecommendationRepository;\nimport com.trigrowth.repository.UserRepository;\nimport com.trigrowth.model.User;\nimport com.trigrowth.model.Role;')

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
