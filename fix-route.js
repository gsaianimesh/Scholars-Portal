const fs = require('fs');

const path = 'src/lib/supabase/middleware.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const publicPaths = ["/login", "/signup", "/auth/callback", "/invite", "/api/invite"];',
  'const publicPaths = ["/login", "/signup", "/auth/callback", "/invite", "/api/invite", "/api/auth/fathom", "/api/webhooks"];'
);

fs.writeFileSync(path, code);
