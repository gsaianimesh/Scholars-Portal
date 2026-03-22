const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

code = code.replace(
  'alert("Failed to create task");',
  'const errData = await res.json();\n         alert("Failed to create task: " + errData.error);'
);

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
