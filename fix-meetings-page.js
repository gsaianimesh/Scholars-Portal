const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/page.tsx', 'utf8');

// State var 
code = code.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\n  const [fathomConnected, setFathomConnected] = useState(true);'
);

code = code.replace(
  'import { Plus, Calendar, Clock, Video, List, ChevronLeft, ChevronRight } from "lucide-react";',
  'import { Plus, Calendar, Clock, Video, List, ChevronLeft, ChevronRight, Brain } from "lucide-react";'
);

// Fathom fetch logic
const loadMeetingRegex = /const \{ data: prof \} = await supabase\n        \.from\("professors"\)\n        \.select\("id"\)/;
const loadMeetingReplace = `const { data: prof } = await supabase\n        .from("professors")\n        .select("id, fathom_api_key, fathom_access_token")`;

code = code.replace(loadMeetingRegex, loadMeetingReplace);

// and also check if !!prof and update state 
const profCheckRegex = /professorId = prof\?\.id \|\| null;/;
const profCheckReplace = `professorId = prof?.id || null;\n      if (prof) {\n        setFathomConnected(!!prof.fathom_api_key || !!prof.fathom_access_token);\n      }`;

code = code.replace(profCheckRegex, profCheckReplace);

// Add the banner above the <h1>
const bannerTargetRegex = /<div className="flex items-center justify-between">\n        <div>\n          <h1 className="text-2xl font-bold tracking-tight">Meetings<\/h1>/;
const bannerReplace = `{!fathomConnected && userRole === "professor" && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
               <Brain className="w-4 h-4" /> Connect Fathom AI
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Automate your workflow. Connect Fathom to get your meeting transcripts, summaries, and action assignments tracked here automatically.
            </p>
          </div>
          <Button 
            size="sm" 
            className="shrink-0 whitespace-nowrap"
            onClick={() => { window.location.href = '/api/auth/fathom/login?returnTo=/dashboard/meetings' }}
          >
            Connect Fathom
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>`;

code = code.replace(bannerTargetRegex, bannerReplace);

fs.writeFileSync('src/app/dashboard/meetings/page.tsx', code);
console.log("Updated meetings page UI.");
