const fs = require('fs');

let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

// Insert the state variable for fathomConnected
code = code.replace(
  'const [fathomError, setFathomError] = useState("");',
  'const [fathomError, setFathomError] = useState("");\n  const [fathomConnected, setFathomConnected] = useState(true);'
);

// Inject checking for professor and their Fathom API key inside loadMeeting()
const loadMeetingRegex = /setMeeting\(meetingRes\.data\);\n    setParticipants\(participantsRes\.data \|\| \[\]\);\n    setActionItems\(actionItemsRes\.data \|\| \[\]\);/;

const replacement = `setMeeting(meetingRes.data);
    setParticipants(participantsRes.data || []);
    setActionItems(actionItemsRes.data || []);

    if (appUser && appUser.role === 'professor') {
       const { data: profData } = await supabase.from('professors').select('fathom_api_key, fathom_access_token').eq('user_id', appUser.id).maybeSingle();
       if (profData) {
          const hasFathom = !!profData.fathom_api_key || !!profData.fathom_access_token;
          setFathomConnected(hasFathom);
       }
    }`;

code = code.replace(loadMeetingRegex, replacement);

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
console.log("Updated loadMeeting with Fathom check state.");
