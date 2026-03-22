const fs = require('fs');

let file = "src/app/onboarding/page.tsx";
let content = fs.readFileSync(file, 'utf8');

// remove useSearchParams and unused direction
content = content.replace(/, useSearchParams /g, "");
content = content.replace(/const searchParams = useSearchParams\(\);\n  /g, "");
content = content.replace(/const \[direction, setDirection\] = useState<"forward" \| "backward">\("forward"\);\n  /g, "");

// we need to remove setDirection references
content = content.replace(/setDirection\("forward"\);\n    /g, "");
content = content.replace(/setDirection\("backward"\);\n    /g, "");

fs.writeFileSync(file, content);
