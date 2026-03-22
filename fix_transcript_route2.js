const fs = require('fs');
const file = 'src/app/api/meetings/[id]/transcript/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import { extractActionItems } from "@/lib/services/ai-summarization";',
  'import { extractActionItems, summarizeMeeting } from "@/lib/services/ai-summarization";'
);

code = code.replace(
  '    const serviceClient = createServiceRoleClient();',
  `    let body: any = {};
    try {
      body = await request.json();
    } catch(e) {}
    const manualTranscript = body?.manualTranscript;

    const serviceClient = createServiceRoleClient();`
);

// We need to inject logic instead of Fathom if manualTranscript is present.
// Looking at lines:
// let fathomMeetingId = meeting.fathom_meeting_id;
// ...
// const finalSummary = summary;
// let extractedActionItems: any[] = [];
// 
// I will replace that whole block with a conditional block.

const targetBlock = code.substring(
  code.indexOf('    let fathomMeetingId = meeting.fathom_meeting_id;'),
  code.indexOf('    // Save both transcript and summary to meeting')
);

const newBlock = `
    let transcript = "";
    let finalSummary = "";
    let extractedActionItems: any[] = [];

    if (manualTranscript) {
      console.log(\`[Transcript API] Using manually provided transcript...\`);
      transcript = manualTranscript;
      
      try {
        console.log(\`[Transcript API] Generating summary and AI action items via Groq...\`);
        const aiResult = await summarizeMeeting(transcript, meeting.agenda, null, new Date().toISOString());
        finalSummary = aiResult.summary;
        if (aiResult.actionItems?.length) {
          extractedActionItems = aiResult.actionItems;
        }
      } catch (err) {
        console.error("[Transcript API] Failed to extract AI summary and tasks:", err);
      }
    } else {
      let fathomMeetingId = meeting.fathom_meeting_id;

      // If no Fathom ID is linked, try to find a matching recording
      if (!fathomMeetingId) {
        console.log(\`[Transcript API] No Fathom ID for meeting \${meeting.id}. Searching for match...\`);
        try {
          const searchAfter = new Date(new Date(meeting.meeting_date).getTime() - 12 * 60 * 60 * 1000).toISOString();
          const calls = await listFathomMeetings(searchAfter, apiKey);

          const scheduledTime = new Date(meeting.meeting_date).getTime();
          let bestMatch = null;
          let smallestDiff = Infinity;

          for (const call of calls) {
            const callTime = new Date(call.date).getTime();
            const timeDiff = Math.abs(callTime - scheduledTime);
            
            if (timeDiff <= 6 * 60 * 60 * 1000) {
              if (timeDiff < smallestDiff) {
                smallestDiff = timeDiff;
                bestMatch = call;
              }
            }
          }

          if (bestMatch) {
            console.log(\`[Transcript API] Found Fathom match: \${bestMatch.id} (\${bestMatch.title})\`);
            fathomMeetingId = bestMatch.id;

            await serviceClient
              .from("meetings")
              .update({ fathom_meeting_id: fathomMeetingId })
              .eq("id", id);
          } else {
            console.warn(\`[Transcript API] No matching Fathom recording found for \${meeting.meeting_date}\`);
            return NextResponse.json(
              { error: "No matching recording found in Fathom yet. Ensure the meeting has ended and processed." },
              { status: 404 }
            );
          }
        } catch (err: any) {
          console.error("Fathom search failed:", err);
          return NextResponse.json({ error: "Failed to search Fathom recordings" }, { status: 500 });
        }
      }

      console.log(\`[Transcript API] Fetching transcript and summary for Fathom ID: \${fathomMeetingId}\`);
      const fathomData = await fetchFathomRecordingData(fathomMeetingId, apiKey);
      transcript = fathomData.transcript;
      finalSummary = fathomData.summary;

      if (transcript || finalSummary) {
        try {
          console.log(\`[Transcript API] Extracting action items using Groq AI...\`);
          const aiResult = await extractActionItems(transcript, finalSummary, meeting.agenda, new Date().toISOString());
          if (aiResult.actionItems?.length) {
            extractedActionItems = aiResult.actionItems;
          }
        } catch (err) {
          console.error("[Transcript API] Failed to extract AI action items:", err);
        }
      }
    }

`;

code = code.replace(targetBlock, newBlock);
fs.writeFileSync(file, code);
console.log("Patched transcript API");
