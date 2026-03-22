const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');
code = code.replace(
\`                    )}
                  </div>
                  {showManualUpload && !meeting.transcript && (\`,
\`                    )}
                  {showManualUpload && !meeting.transcript && (\`
);
fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
