import re
with open('frontend/src/pages/dashboard/NotificationsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'id:\s*i_demo_auto_1,', 'id: "ai_demo_auto_1",', content)

with open('frontend/src/pages/dashboard/NotificationsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
