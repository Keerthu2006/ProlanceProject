import re

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'r', encoding='utf-8') as f:
    content = f.read()

old_offer = """                                      case "OFFER_DISCOUNT"         -> {
                  try {
                      List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
                      if (!clients.isEmpty()) {
                          User target = clients.get(0);
                          SimpleMailMessage msg = new SimpleMailMessage();
                          msg.setFrom("adminprolance@gmail.com");
                          msg.setTo(target.getEmail());
                          msg.setSubject("Exclusive 20% Discount for Your Next Project!");
                          msg.setText("Hi " + target.getFullName() + ",\n\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.");
                          mailSender.send(msg);
                          log.info("Sent discount to " + target.getEmail());
                      }
                  } catch(Exception e) {}
                  yield "Discount codes automatically generated and sent to high-risk users. Detail: " + detail;
              }"""

new_offer = """                                      case "OFFER_DISCOUNT"         -> {
                  try {
                      List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
                      if (!clients.isEmpty()) {
                          User target = clients.get(0);
                          String subject = "Exclusive 20% Discount for Your Next Project!";
                          String text = "Hi " + target.getFullName() + ",\\n\\nUse code PROLANCE-20 for 20% off your next project posting! Valid for 7 days.";
                          sendEmailOrNotify(target, subject, text);
                      }
                  } catch(Exception e) {}
                  yield "Discount codes automatically generated and sent to high-risk users. Detail: " + detail;
              }"""

content = content.replace(old_offer, new_offer)

with open('backend/src/main/java/com/trigrowth/service/AutomationService.java', 'w', encoding='utf-8') as f:
    f.write(content)
