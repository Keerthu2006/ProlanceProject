import re

with open("backend/src/main/java/com/trigrowth/controller/OwnerController.java", "r", encoding="utf-8") as f:
    content = f.read()

old_method = """    @PostMapping("/automations/manual-trigger")
    public ResponseEntity<Map<String, Object>> manualTrigger(@RequestBody Map<String, String> payload) {
        String actionType = payload.get("actionType");
        String detail = payload.getOrDefault("detail", "");
        
        String result = automationService.manualExecute(actionType, detail);
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Action triggered: " + actionType, "result", result));
    }"""

new_method = """    @PostMapping("/automations/manual-trigger")
    public ResponseEntity<Map<String, Object>> manualTrigger(@RequestBody Map<String, String> payload) {
        String actionType = payload.get("actionType");
        String detail = payload.getOrDefault("detail", "");
        
        String result;
        if (payload.containsKey("targetUserId")) {
            Long targetUserId = Long.parseLong(payload.get("targetUserId"));
            result = automationService.manualExecuteTargeted(actionType, detail, targetUserId);
        } else {
            result = automationService.manualExecute(actionType, detail);
        }
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Action triggered: " + actionType, "result", result));
    }"""

content = content.replace(old_method, new_method)

with open("backend/src/main/java/com/trigrowth/controller/OwnerController.java", "w", encoding="utf-8") as f:
    f.write(content)
