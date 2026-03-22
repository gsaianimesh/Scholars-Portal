const fs = require('fs');
let code = fs.readFileSync('src/app/api/meetings/[id]/summarize/route.ts', 'utf8');
console.log(code.substring(code.indexOf('// Create action items')));
