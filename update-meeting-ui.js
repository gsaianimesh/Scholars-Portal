const fs = require('fs');

let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

const regexUi = /<\!-\- Auto-Created Tasks Dialog \-\->/;

const renderBlock = `{isPast && userRole !== "scholar" && !meeting.transcript && !fathomConnected && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Connect Fathom</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Connect Fathom to automatically get your meeting summaries, action items, and task assignments generated right here directly.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2 text-xs" 
                    onClick={() => window.location.href = '/api/auth/fathom/login'}
                  >
                    Connect with Fathom
                  </Button>
                </div>
              )}

              {isPast && userRole !== "scholar" && (
                <div className="flex flex-col gap-2">`;

// replace 
code = code.replace(/\{isPast && userRole !== "scholar" && \(\n                <div className="flex flex-col gap-2">\n                  <div className="flex gap-2 items-center flex-wrap">/, 
`{isPast && userRole !== "scholar" && !meeting.transcript && !fathomConnected && (
                <div className="mt-2 mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                     <Brain className="w-4 h-4" /> Connect Fathom for AI Transcripts
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Connect Fathom to automatically get your meeting summaries, action items, and task assignments directly processed into this portal post-call.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-1" 
                    onClick={() => { window.location.href = '/api/auth/fathom/login?returnTo=/dashboard/meetings/' + params.id }}
                  >
                    Connect Fathom
                  </Button>
                </div>
              )}
              {isPast && userRole !== "scholar" && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center flex-wrap">`);

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
console.log("Updated UI for missing Fathom integration");
