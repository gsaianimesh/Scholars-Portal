const fs = require('fs');

let code = fs.readFileSync('src/app/api/meetings/[id]/context/route.ts', 'utf8');

// Add import
if (!code.includes('generateMeetingInsights')) {
  code = code.replace(
    'import { createServiceRoleClient } from "@/lib/supabase/server";',
    'import { createServiceRoleClient } from "@/lib/supabase/server";\nimport { generateMeetingInsights } from "@/lib/services/ai-summarization";'
  );
}

// Generate insights
const replacement = `
  let insights = null;
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
  }

  return NextResponse.json({
    lastMeetingSummary: previousMeeting?.summary || null,
    lastMeetingTitle: previousMeeting?.meeting_title || null,
    lastMeetingDate: previousMeeting?.meeting_date || null,
    pendingTasks: pendingTasks || [],
    recentSubmissions: recentSubmissions || [],
    insights: insights || null,
  });
`;

code = code.replace(/return NextResponse\.json\(\{\s*lastMeetingSummary[\s\S]*\}\);/, replacement.trim());

fs.writeFileSync('src/app/api/meetings/[id]/context/route.ts', code);
