import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Add UserRepository import
content = content.replace(
    'import com.trigrowth.repository.*;',
    'import com.trigrowth.repository.*;\nimport com.trigrowth.model.User;\nimport com.trigrowth.model.Role;\nimport java.util.List;'
)

# Inject UserRepository
content = content.replace(
    'private final JavaMailSender             mailSender;',
    'private final JavaMailSender             mailSender;\n    private final UserRepository             userRepository;'
)

# Update OFFER_DISCOUNT to fetch a real client
replacement_discount = '''              case "OFFER_DISCOUNT"         -> {
                  try {
                      List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
                      if (!clients.isEmpty()) {
                          User target = clients.get(0);
                          SimpleMailMessage msg = new SimpleMailMessage();
                          msg.setFrom("adminprolance@gmail.com");
                          msg.setTo(target.getEmail());
                          msg.setSubject("Exclusive 20% Discount for Your Next Project!");
                          msg.setText("Hi " + target.getFullName() + ",\\n\\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.");
                          mailSender.send(msg);
                          log.info("Sent discount to " + target.getEmail());
                      }
                  } catch(Exception e) {}
                  yield "Discount codes automatically generated and sent to high-risk users. Detail: " + detail;
              }'''

content = re.sub(r'case "OFFER_DISCOUNT"[^\n]+(?:\n.+?)+?yield [^;]+;\n              }', replacement_discount, content)


with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
