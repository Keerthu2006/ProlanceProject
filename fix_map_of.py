import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

old_try = """        try {
            Map<String, Object> requestBody = Map.of(
                    "action_type", actionType,
                    "context", Map.of(
                            "problem",            rec.getProblem(),
                            "recommended_action", rec.getRecommendedAction(),
                            "detail",             detail
                    )
            );"""

new_try = """        try {
            Map<String, Object> context = new java.util.HashMap<>();
            context.put("problem", rec.getProblem() != null ? rec.getProblem() : "");
            context.put("recommended_action", rec.getRecommendedAction() != null ? rec.getRecommendedAction() : "");
            context.put("detail", detail != null ? detail : "");

            Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("action_type", actionType != null ? actionType : "");
            requestBody.put("context", context);"""

content = content.replace(old_try, new_try)

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
