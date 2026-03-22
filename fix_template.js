const fs = require('fs');
let code = fs.readFileSync('src/app/api/webhooks/fathom/register/route.ts', 'utf8');

code = code.replace(
  '\\`\\${protocol}://\\${host}/api/webhooks/fathom?prof_id=\\${prof.id}\\`',
  '`${protocol}://${host}/api/webhooks/fathom?prof_id=${prof.id}`'
);

fs.writeFileSync('src/app/api/webhooks/fathom/register/route.ts', code);
