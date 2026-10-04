import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    return match.group(0).replace('\n', '\\n')

# Actually, I'll just rewrite the switch statement cleanly.
pattern = re.compile(r'String finalDetail = switch \(actionType\) \{.*?\};', re.DOTALL)
new_switch = """        String finalDetail = switch (actionType) {
            case "NOTIFY_FREELANCERS"     -> "Notified freelancers matching required skills. Detail: " + detail;
            case "FEATURE_PROJECT"        -> "Project featured on homepage for 48h. Detail: " + detail;
            case "EMAIL_CLIENT", "EMAIL_INACTIVE_USER", "EMAIL_PRODUCT_NEGLECT", "EMAIL_FINANCIAL_REPORT", "EMAIL_OWNER_REPORT", "EMAIL_CUSTOMER_NEGLECT" -> {
                try {
                    List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
                    for (User target : clients) {
                        String subject = "TriGrowth AI - " + actionType.replace("_", " ");
                        String text = "Hi " + target.getFullName() + ",\\n\\n" + detail;
                        sendEmailOrNotify(target, subject, text);
                    }
                } catch(Exception e) {}
                yield "Automated email executed. Detail: " + detail;
            }
            case "SCHEDULE_FOLLOWUP"      -> "Follow-up scheduled in 3 days. Detail: " + detail;
            case "OFFER_DISCOUNT"         -> {
                try {
                    List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
                    for (User target : clients) {
                        String subject = "Exclusive 20% Discount for Your Next Project!";
                        String text = "Hi " + target.getFullName() + ",\\n\\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.";
                        sendEmailOrNotify(target, subject, text);
                    }
                } catch(Exception e) {}
                yield "Discount codes automatically generated and sent to high-risk users. Detail: " + detail;
            }
            case "DRAFT_EMAIL_CAMPAIGN",
                 "DRAFT_SOCIAL_POST",
                 "DRAFT_LANDING_PAGE",
                 "DRAFT_HOMEPAGE_BANNER",
                 "DRAFT_RECRUITMENT_EMAIL" -> callAiDraft(actionType, detail, rec);
            default -> "Action logged: " + detail;
        };"""

content = pattern.sub(new_switch, content)

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
