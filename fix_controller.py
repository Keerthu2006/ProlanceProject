with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

manual_execute_code = '''
    public String manualExecute(String actionType, String detail) {
        try {
            Recommendation dummy = Recommendation.builder().id(9999L).build();
            String result = executeAction(actionType, detail, dummy);
            return result;
        } catch (Exception e) {
            log.error("Manual execution failed", e);
            return "Failed: " + e.getMessage();
        }
    }
'''

content = content.replace('public void execute(Recommendation recommendation) {', manual_execute_code + '\n    public void execute(Recommendation recommendation) {')

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
