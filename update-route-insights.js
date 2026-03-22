const fs = require('fs');

let code = fs.readFileSync('src/app/api/meetings/[id]/context/route.ts', 'utf8');

// Change select
code = code.replace(
  '.select("professor_id, meeting_date")',
  '.select("*")'
);

const targetBlock = `  let insights = null;
  if (previousMeeting?.summary || pendingTasks.length > 0) {
    try {
      insights = await generateMeetingInsights(
        previousMeeting?.summary || "",
        pendingTasks,
        recentSubmissions
      );
    } catch (e) {
      console.error("Failed to generate meeting insights via Groq:", e);
    }
  }`;

const replacementBlock = `  let insights = meeting.pre_meeting_insights || null;
  if (!insights && (previousMeeting?.summary || pendingTasks.length > 0)) {
    try {
      insights = await generateMeetingInsights(
        previousMeeting?.summary || "",
        pendingTasks,
        recentSubmissions
      );
      
      // Save insights to DB
      await serviceClient
        .from("meetings")
        .update({ pre_meeting_insights: insights })
        .eq("id", params.id);
    } catch (e) {
      console.error("Failed to generate meeting insights:", e);
    }
  }`;

code = code.replace(targetBlock, replacementBlock);

fs.writeFileSync('src/app/api/meetings/[id]/context/route.ts', code);
