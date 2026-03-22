const fs = require('fs');

// Professor
let file = "src/components/dashboard/professor-dashboard.tsx";
let content = fs.readFileSync(file, 'utf8');
content = content.replace("    const relevantUserIds = [userId, ...scholarUserIds];\n\n", "");
fs.writeFileSync(file, content);

// CoSup
file = "src/components/dashboard/co-supervisor-dashboard.tsx";
content = fs.readFileSync(file, 'utf8');
content = content.replace("    const relevantUserIds = [userId, ...scholarUserIds];\n", "");
content = content.replace("    if (profRes.data?.user_id) {\n      relevantUserIds.push(profRes.data.user_id);\n    }\n\n", "");
fs.writeFileSync(file, content);

