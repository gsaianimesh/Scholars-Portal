const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/chat/page.tsx', 'utf-8');

const target = `          // Wait, supabase update over multiple items requires .in('id', ids)
          await supabase.from('activity_logs')
            .update({ metadata: { receiver_id: currentUser.id, read: true } })
            .in('id', ids);
          console.log("Update unread result");
            
          setUnreadCounts(prev => ({...prev, [activeContact.id]: 0}));`;

const replace = `          // Bypass RLS via backend route to mark as read
          await fetch('/api/chat/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          
          setUnreadCounts(prev => ({...prev, [activeContact.id]: 0}));`;

code = code.replace(target, replace);
fs.writeFileSync('src/app/dashboard/chat/page.tsx', code);
