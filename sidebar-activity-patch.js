const fs = require('fs');
let code = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf-8');

const oldCode = `          (payload) => {
            if (
              pathname !== "/dashboard/chat" &&
              (payload.new as any).activity_type === "direct_message" &&
              (payload.new as any).metadata?.receiver_id === appUser.id
            ) {
              setChatCount((prev) => prev + 1);
            }
          },`;

const newCode = `          (payload) => {
            if (
              (payload as any).eventType === "INSERT" &&
              pathname !== "/dashboard/chat" &&
              (payload.new as any).activity_type === "direct_message" &&
              (payload.new as any).metadata?.receiver_id === appUser.id &&
              (payload.new as any).metadata?.read !== true
            ) {
              setChatCount((prev) => prev + 1);
            }
            if (
              (payload as any).eventType === "UPDATE" &&
              (payload.new as any).activity_type === "direct_message" &&
              (payload.new as any).metadata?.receiver_id === appUser.id &&
              (payload.new as any).metadata?.read === true
            ) {
              setChatCount((prev) => Math.max(0, prev - 1));
            }
          },`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/layout/sidebar.tsx', code);
