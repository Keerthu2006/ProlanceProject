const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/NotificationsPage.jsx', 'utf8');
content = content.replace(/id:\s*i_demo_auto_1,/g, 'id: "ai_demo_auto_1",');
fs.writeFileSync('frontend/src/pages/dashboard/NotificationsPage.jsx', content, 'utf8');
