const fs = require('fs');
let content = fs.readFileSync('src/app/api/meetings/[id]/transcript/route.ts', 'utf8');

// The replacement logic will be done using node for simplicity since it's quite large.
// Actually, I can use replace_string_in_file or vim. 
