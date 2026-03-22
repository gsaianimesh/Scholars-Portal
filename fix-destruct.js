const fs = require('fs');
let code = fs.readFileSync('src/app/api/tasks/route.ts', 'utf8');

code = code.replace(
  'const { title, description: description || "", deadline, expectedOutputFormat, referenceLinks, scholarIds, meetingId } = body;',
  'const { title, description, deadline, expectedOutputFormat, referenceLinks, scholarIds, meetingId } = body;'
);
fs.writeFileSync('src/app/api/tasks/route.ts', code);
