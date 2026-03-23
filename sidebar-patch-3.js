const fs = require('fs');
let code = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf-8');

// The sidebar realtime channel currently listens to INSERT
// We need to also listen to UPDATE to decrease the side badge count when a message is read inside the chat component
code = code.replace(
  /event: 'INSERT',/,
  `event: '*',`
);

code = code.replace(
  /if \(pathname !== '\/dashboard\/chat' && payload\.new\.activity_type === 'direct_message' && payload\.new\.metadata\?\.receiver_id === appUser\.id\) \{\n\s*setChatCount\(\(prev\) => prev \+ 1\);\n\s*\}/,
  `if (payload.eventType === 'INSERT' && pathname !== '/dashboard/chat' && payload.new.activity_type === 'direct_message' && payload.new.metadata?.receiver_id === appUser.id) {
              setChatCount((prev) => prev + 1);
            }
            if (payload.eventType === 'UPDATE' && payload.new.activity_type === 'direct_message' && payload.new.metadata?.receiver_id === appUser.id && payload.new.metadata?.read === true && payload.old?.metadata?.read === false) {
              setChatCount((prev) => Math.max(0, prev - 1));
            }`
);

fs.writeFileSync('src/components/layout/sidebar.tsx', code);
console.log("Patched sidebar update listener");
