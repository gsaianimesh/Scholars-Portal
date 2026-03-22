const fs = require('fs');
let content = fs.readFileSync('src/app/onboarding/page.tsx', 'utf8');

content = content.replace("        );", "        );\n      default:\n        return null;");

fs.writeFileSync('src/app/onboarding/page.tsx', content);
