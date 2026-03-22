const fs = require('fs');

let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

const regex = /  async function generateSummary\(\) \{\n    setGeneratingSummary\(true\);\n    try \{\n      const res = await fetch\(`\/api\/meetings\/\$\{params\.id\}\/summarize`, \{\n        method: "POST",\n      \}\);\n      if \(res\.ok\) \{\n        loadMeeting\(\);\n      \}\n    \} finally \{\n      setGeneratingSummary\(false\);\n    \}\n  \}/;

const newBlock = `  async function generateSummary() {
    setGeneratingSummary(true);
    try {
      const res = await fetch(\`/api/meetings/\${params.id}/summarize\`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoCreatedTasks && data.autoCreatedTasks.length > 0) {
          setAutoTasks(data.autoCreatedTasks);
        }
        loadMeeting();
      }
    } finally {
      setGeneratingSummary(false);
    }
  }`;

if(code.match(regex)) {
    code = code.replace(regex, newBlock);
    fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
    console.log("Updated generateSummary");
} else {
    console.log("Regex didn't match.");
}
