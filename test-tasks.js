const fs = require('fs');
let code = fs.readFileSync('src/app/api/tasks/route.ts', 'utf8');

code = code.replace(
  'if (taskError) {\\n    return NextResponse.json({ error: taskError.message }, { status: 500 });\\n  }',
  'if (taskError) {\\n    console.error("taskError:", taskError);\\n    return NextResponse.json({ error: taskError.message }, { status: 500 });\\n  }'
);

code = code.replace(
  'if (assignError) {\\n    return NextResponse.json({ error: assignError.message }, { status: 500 });\\n  }',
  'if (assignError) {\\n    console.error("assignError:", assignError);\\n    return NextResponse.json({ error: assignError.message }, { status: 500 });\\n  }'
);

fs.writeFileSync('src/app/api/tasks/route.ts', code);
