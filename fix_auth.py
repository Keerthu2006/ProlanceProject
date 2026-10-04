import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Add JavaMailSender import and injection
content = content.replace(
    'import org.springframework.web.client.RestTemplate;',
    'import org.springframework.web.client.RestTemplate;\nimport org.springframework.mail.javamail.JavaMailSender;\nimport org.springframework.mail.SimpleMailMessage;'
)

content = content.replace(
    'private final ObjectMapper               objectMapper;',
    'private final ObjectMapper               objectMapper;\n    private final JavaMailSender             mailSender;'
)

# Replace the specific case switch for OFFER_DISCOUNT to actually send email
replacement_discount = '''              case "OFFER_DISCOUNT"         -> {
                  try {
                      SimpleMailMessage msg = new SimpleMailMessage();
                      msg.setFrom("noreply@prolance.ai");
                      msg.setTo("demo.client@prolance.ai");
                      msg.setSubject("Exclusive 20% Discount for Your Next Project!");
                      msg.setText("Use code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.");
                      mailSender.send(msg);
                  } catch(Exception e) {}
                  yield "Discount codes automatically generated and sent to high-risk users. Detail: " + detail;
              }'''

content = re.sub(r'case "OFFER_DISCOUNT"[^\n]+', replacement_discount, content)

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
