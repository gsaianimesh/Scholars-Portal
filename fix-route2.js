const fs = require('fs');

const path = 'src/lib/supabase/middleware.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'if (user && isPublicPath && !isHomePage && !request.nextUrl.pathname.startsWith("/api/invite", "/api/auth/fathom", "/api/webhooks")) {',
  'const isApiWhitelisted = ["/api/invite", "/api/auth/fathom", "/api/webhooks"].some(p => request.nextUrl.pathname.startsWith(p));\n  if (user && isPublicPath && !isHomePage && !isApiWhitelisted) {'
);

fs.writeFileSync(path, code);
