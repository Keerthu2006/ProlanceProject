import re
with open('frontend/src/pages/dashboard/NotificationsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Just replace the exact broken line fragments
content = content.replace('id:  i_demo_auto_1,', 'id: \"ai_demo_auto_1\",')
content = content.replace('message: An AI automation workflow was triggered on your account (e.g. Discount Offer, Feature Guide, or Profile Nudge) to help you succeed!,', 'message: \"An AI automation workflow was triggered on your account (e.g. Discount Offer, Feature Guide, or Profile Nudge) to help you succeed!\",')

with open('frontend/src/pages/dashboard/NotificationsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
