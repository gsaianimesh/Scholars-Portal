const fs = require('fs');

let content = fs.readFileSync('src/app/api/meetings/[id]/transcript/route.ts', 'utf8');

// Replace summarizeMeeting call
content = content.replace(
  'const aiResult = await summarizeMeeting(transcript, meeting.agenda);',
  'const aiResult = await summarizeMeeting(transcript, meeting.agenda, null, new Date().toISOString());'
);

// We need to add auto-task assignment logic. Let's find the section that handles action items
const oldActionItemLogic = `
    // Save action items to DB if any
    if (extractedActionItems.length > 0) {
      const itemsToInsert = extractedActionItems.map((item) => ({
        meeting_id: id,
        title: item.title,
        description: item.description,
        assignee_name: item.assignee,
        due_date: item.dueDate || null,
        status: "pending"
      }));

      await serviceClient.from("action_items").insert(itemsToInsert);
    }`;

const newActionItemLogic = `
    // Save action items to DB if any
    let autoCreatedTasks = [];
    if (extractedActionItems.length > 0) {
      const itemsToInsert = extractedActionItems.map((item) => ({
        meeting_id: id,
        title: item.title,
        description: item.description,
        assignee_name: item.assignee,
        due_date: item.dueDate || null,
        status: "pending"
      }));

      await serviceClient.from("action_items").insert(itemsToInsert);

      // Auto create Tasks out of them
      const { data: profData } = await serviceClient
        .from("professors")
        .select("user_id")
        .eq("id", meeting.professor_id)
        .single();
      const createdBy = profData?.user_id;

      // Fetch participants to assign to scholars
      const { data: participants } = await serviceClient
        .from("meeting_participants")
        .select("user_id")
        .eq("meeting_id", id);
      
      const userIds = participants?.map(p => p.user_id) || [];
      let scholarsData = [];
      if (userIds.length > 0) {
        const { data: schData } = await serviceClient
          .from("scholars")
          .select("id, user_id, users(name)")
          .in("user_id", userIds);
        scholarsData = schData || [];
      }

      if (createdBy) {
        for (const item of extractedActionItems) {
          // Prepare the task
          const taskInsert = {
            title: item.title || "Untitled Task",
            description: item.description || "",
            created_by: createdBy,
            professor_id: meeting.professor_id,
            deadline: item.dueDate || null,
            status: "not_started"
          };
          
          const { data: insertedTask, error: taskErr } = await serviceClient
            .from("tasks")
            .insert(taskInsert)
            .select()
            .single();

          if (insertedTask && !taskErr) {
            // Assign to matched scholars, or all scholars in meeting if "unassigned" / cannot determine
            let assignedScholars = scholarsData;
            
            // basic matching attempt:
            if (item.assignee && item.assignee.toLowerCase() !== 'unassigned') {
              const matched = scholarsData.filter(s => 
                s.users?.name?.toLowerCase().includes(item.assignee.toLowerCase())
              );
              if (matched.length > 0) {
                assignedScholars = matched;
              }
            }

            for (const sch of assignedScholars) {
              await serviceClient.from("task_assignments").insert({
                task_id: insertedTask.id,
                scholar_id: sch.id,
                status: "not_started"
              });
            }

            autoCreatedTasks.push({
              ...insertedTask,
              assignees: assignedScholars.map(s => s.users?.name).join(", ")
            });
          }
        }
      }
    }`;

content = content.replace(oldActionItemLogic, newActionItemLogic);

content = content.replace(
  'actionItems: extractedActionItems',
  'actionItems: extractedActionItems,\n      autoCreatedTasks'
);

fs.writeFileSync('src/app/api/meetings/[id]/transcript/route.ts', content);
console.log('Applied script modifications.');
