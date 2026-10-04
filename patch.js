const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/dashboard/NotificationsPage.jsx', 'utf8');
c = c.replace('// Sort by date desc', 'const storageKeyWs = prolance_ws_notifs_;\n        const wsNotifs = JSON.parse(localStorage.getItem(storageKeyWs) || \'[]\');\n        wsNotifs.forEach(n => {\n            genNotifs.push({\n                id: n.id,\n                type: \'Live\',\n                color: \'#10b981\',\n                icon: <Bell size={20} />,\n                title: n.title,\n                message: n.message,\n                date: n.date\n            });\n        });\n\n        // Sort by date desc');
fs.writeFileSync('frontend/src/pages/dashboard/NotificationsPage.jsx', c);
