import re

with open('backend/src/main/java/com/trigrowth/service/OtpService.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace(
    'import org.springframework.web.client.RestTemplate;',
    'import org.springframework.web.client.RestTemplate;\nimport org.springframework.mail.javamail.JavaMailSender;\nimport jakarta.mail.internet.MimeMessage;\nimport org.springframework.mail.javamail.MimeMessageHelper;'
)

# Replace the injection
content = content.replace(
    'private final RestTemplate restTemplate;',
    'private final RestTemplate restTemplate;\n    private final JavaMailSender mailSender;'
)

# Replace the Brevo logic with JavaMailSender
old_logic = '''        // Send via Brevo Transactional Email HTTP API (port 443 - works on any network)'''

new_logic = '''        // Send via JavaMailSender (Gmail SMTP)
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("adminprolance@gmail.com");
            helper.setTo(email);
            helper.setSubject("Your ProLance Verification Code");
            
            String htmlBody = "<div style='font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#0D0A07;color:#FFDBBB;border-radius:12px'><h2 style='color:#997E67'>ProLance Verification</h2><p>Your 6-digit verification code is:</p><div style='font-size:36px;font-weight:bold;letter-spacing:10px;padding:20px;background:#1a1208;border:2px solid #997E67;border-radius:8px;text-align:center;color:#FFDBBB'>" + otp + "</div><p style='color:#997E67;font-size:12px'>This code expires in 10 minutes. Do not share it with anyone.</p></div>";
            
            helper.setText(htmlBody, true);
            mailSender.send(message);
            
            log.info("OTP email sent to {} via Gmail SMTP", email);
            return null; // null = real email sent, no demo_otp needed
        } catch (Exception e) {
            log.warn("Gmail SMTP email failed for {} (OTP: {}): {}", email, otp, e.getMessage());
        }
        
        // Return OTP for demo display if real email could not be sent
        return otp;
    }
'''

# Use regex to replace everything from the Brevo comment to the end of the method
content = re.sub(r'        // Send via Brevo Transactional Email HTTP API.*?return otp;\n    }', new_logic, content, flags=re.DOTALL)


with open('backend/src/main/java/com/trigrowth/service/OtpService.java', 'w', encoding='utf-8') as f:
    f.write(content)
