const fs = require('fs');
let code = fs.readFileSync('src/app/api/tasks/route.ts', 'utf8');

code = code.replace(
  'expected_output_format: expectedOutputFormat || null,\n      reference_links: referenceLinks || null,',
  'expected_output_format: expectedOutputFormat || null,\n      reference_links: referenceLinks || null,\n      meeting_id: meetingId || null,'
);

fs.writeFileSync('src/app/api/tasks/route.ts', code);
