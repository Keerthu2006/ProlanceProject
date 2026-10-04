import re

with open('frontend/src/pages/dashboard/ClientDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("freelancer_name: 'Freelancer #' + m.freelancer_id,", "freelancer_name: m.freelancer_name || ('Freelancer #' + m.freelancer_id),")

with open('frontend/src/pages/dashboard/ClientDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
