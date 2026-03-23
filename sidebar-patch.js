const fs = require('fs');
let code = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf-8');

// Insert the state variable
code = code.replace(
  /const \[meetingCount, setMeetingCount\] = useState\(0\);/,
  `const [meetingCount, setMeetingCount] = useState(0);\n  const [chatCount, setChatCount] = useState(0);`
);

// Add the chat badge logic in fetchData
code = code.replace(
  /setMeetingCount\(meetingNotifs\?\.length \|\| 0\);\n        }/,
  `setMeetingCount(meetingNotifs?.length || 0);
        }

        const { data: chatNotifs } = await supabase
          .from("activity_logs")
          .select("id")
          .eq("activity_type", "direct_message")
          .eq("metadata->>receiver_id", appUser.id)
          .eq("metadata->>read", "false");

        if (pathname === "/dashboard/chat" || pathname.startsWith("/dashboard/chat/")) {
          // If on chat page, assumed we are handling read logic inside chat page.
          // In real code we'd need to sync it, but for now we set it initially
        }
        setChatCount(chatNotifs?.length || 0);`
);

// Add the real-time hook for chat messages
code = code.replace(
  /if \(type === 'meeting_scheduled' && !pathname\.startsWith\('\/dashboard\/meetings'\)\) \{\n              setMeetingCount\(prev => prev \+ 1\);\n            \}/,
  `if (type === 'meeting_scheduled' && !pathname.startsWith('/dashboard/meetings')) {
              setMeetingCount(prev => prev + 1);
            }
            if (pathname !== '/dashboard/chat' && payload.new.activity_type === 'direct_message' && payload.new.metadata?.receiver_id === appUser.id) {
              setChatCount(prev => prev + 1);
            }`
);

// Replace mapping chat badge
code = code.replace(
  /\{link\.label === "Meetings" && meetingCount > 0 && \(\s*<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-\[10px\] font-bold text-primary-foreground">\s*\{meetingCount\}\s*<\/span>\s*\)\}/,
  `{link.label === "Meetings" && meetingCount > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {meetingCount}
                    </span>
                  )}
                  {link.label === "Chat" && chatCount > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {chatCount}
                    </span>
                  )}`
);

fs.writeFileSync('src/components/layout/sidebar.tsx', code);
console.log("Patched sidebar");
