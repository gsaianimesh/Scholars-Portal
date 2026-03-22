const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

const regex = /\s*\{preMeetingContext\.insights && \([\s\S]*?AI Meeting Insights \(Groq\)[\s\S]*?<\/div>\n\s*\)\}\n/;
code = code.replace(regex, '\n');

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
