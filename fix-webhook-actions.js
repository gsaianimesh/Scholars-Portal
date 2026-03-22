const fs = require('fs');
let code = fs.readFileSync('src/app/api/webhooks/fathom/route.ts', 'utf8');

if (!code.includes('extractActionItems')) {
  code = code.replace(
    'import { fetchFathomRecordingData } from "@/lib/services/fathom";',
    'import { fetchFathomRecordingData } from "@/lib/services/fathom";\nimport { extractActionItems } from "@/lib/services/ai-summarization";'
  );
}

// Find the block from "// Process tasks using payload directly" to the end of its block
const taskBlockRegex = /\/\/ Process tasks using payload directly[\s\S]*?(?=\n    return)/;

const newBlock = `// Extract action items directly from AI summary and transcript
    let extractedActionItems: any[] = [];
    if (transcript || summary) {
      try {
        console.log("[Fathom Webhook] Extracting action items using Groq AI...");
        const aiResult = await extractActionItems(transcript, summary, matchedMeeting.agenda, new Date().toISOString());
        if (aiResult.actionItems && aiResult.actionItems.length > 0) {
          extractedActionItems = aiResult.actionItems;
        }
      } catch (err) {
        console.error("[Fathom Webhook] Failed to extract AI action items:", err);
      }
    }

    if (extractedActionItems.length > 0) {
      const { data: profUsr } = await serviceClient.from("professors").select("user_id").eq("id", matchedMeeting.professor_id).single();
      const createdBy = profUsr?.user_id;

      // Fetch participants for matching
      const { data: participants } = await serviceClient.from("meeting_participants").select("user_id").eq("meeting_id", matchedMeeting.id);
      const userIds = participants?.map((p: any) => p.user_id) || [];
      let scholarsData: any[] = [];
      if (userIds.length > 0) {
        const { data: schData } = await serviceClient.from("scholars").select("id, user_id, users(name, email)").in("user_id", userIds);
        scholarsData = schData || [];
      } else {
        // Fallback: get all scholars for this professor if no participants mapped yet
        const { data: allScholars } = await serviceClient.from("scholars").select("id, user_id, users(name, email)").eq("professor_id", matchedMeeting.professor_id);
        scholarsData = allScholars || [];
      }

      if (createdBy) {
        for (const item of extractedActionItems) {
          const taskInsert = {
            title: item.title || "Action Item",
            description: item.description || "",
            created_by: createdBy,
            professor_id: matchedMeeting.professor_id,
            deadline: item.dueDate || null,
            status: "not_started",
            meeting_id: matchedMeeting.id,
            is_auto_generated: true
          };
          
          const { data: task, error: errr } = await serviceClient.from("tasks").insert(taskInsert).select().single();
          
          if (task && !errr) {
             let assignedScholars = scholarsData;
             
             if (item.assignee && item.assignee.toLowerCase() !== 'unassigned') {
                 const assigneeLower = String(item.assignee).toLowerCase();
                 const assigneeMatch = scholarsData.filter((s: any) => 
                     s.users?.name?.toLowerCase().includes(assigneeLower) ||
                     s.users?.email?.toLowerCase().includes(assigneeLower)
                 );
                 if (assigneeMatch.length > 0) {
                     assignedScholars = assigneeMatch;
                 }
             }

             for (const sch of assignedScholars) {
                await serviceClient.from("task_assignments").insert({
                   task_id: task.id,
                   scholar_id: sch.id,
                   status: "not_started"
                });
             }
          }
        }
      }
    }`;

code = code.replace(taskBlockRegex, newBlock);

fs.writeFileSync('src/app/api/webhooks/fathom/route.ts', code);
console.log("Hook updated");
