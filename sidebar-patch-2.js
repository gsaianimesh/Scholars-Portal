const fs = require('fs');
let code = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf-8');

code = code.replace(
  /let channel: any = null;/,
  `let notifChannel: any = null;\n    let activityChannel: any = null;`
);

code = code.replace(
  /channel = supabase\s*\n\s*\.channel\('sidebar-notifications'\)/,
  `notifChannel = supabase\n        .channel('sidebar-notifications')`
);

code = code.replace(
  /\.subscribe\(\);/,
  `.subscribe();
        
      activityChannel = supabase
        .channel('sidebar-activity-logs')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs'
          },
          (payload) => {
            if (pathname !== '/dashboard/chat' && 
                payload.new.activity_type === 'direct_message' && 
                payload.new.metadata?.receiver_id === appUser.id) {
              setChatCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();`
);

code = code.replace(
  /if \(channel\) \{\n\s*supabase\.removeChannel\(channel\);\n\s*\}/,
  `if (notifChannel) supabase.removeChannel(notifChannel);
      if (activityChannel) supabase.removeChannel(activityChannel);`
);

fs.writeFileSync('src/components/layout/sidebar.tsx', code);
console.log("Patched sidebar to listen to activity_logs");
