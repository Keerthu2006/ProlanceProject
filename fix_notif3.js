const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/NotificationsPage.jsx', 'utf8');
content = content.replace(/\x07i_demo_auto_1/g, '"ai_demo_auto_1"');
fs.writeFileSync('frontend/src/pages/dashboard/NotificationsPage.jsx', content, 'utf8');
