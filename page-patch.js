const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/chat/page.tsx', 'utf-8');

const regex = /\/\/ Wait, supabase update over multiple items.*?\n.*?\n.*?\n.*?\n.*?\n.*?;/mg;
code = code.replace(regex, `// Bypass RLS via backend route to mark as read
          await fetch('/api/chat/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          
          setUnreadCounts(prev => ({...prev, [activeContact.id]: 0}));`);

fs.writeFileSync('src/app/dashboard/chat/page.tsx', code);
