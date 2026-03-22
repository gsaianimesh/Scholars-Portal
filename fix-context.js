const fs = require('fs');
let code = fs.readFileSync('src/app/api/meetings/[id]/context/route.ts', 'utf8');

code = code.replace(
  'participants?.map(p => p.user_id)',
  'participants?.map((p: any) => p.user_id)'
);
fs.writeFileSync('src/app/api/meetings/[id]/context/route.ts', code);
