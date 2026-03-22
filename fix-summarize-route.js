const fs = require('fs');

let code = fs.readFileSync('src/app/api/meetings/[id]/summarize/route.ts', 'utf8');

const replacement = `// Auto create Tasks out of them
    const autoCreatedTasks: any[] = [];
    if (result.actionItems?.length > 0) {
      const { data: profData } = await serviceClient
        .from("professors")
        .select("user_id")
        .eq("id", meeting.professor_id)
        .single();
      const createdBy = profData?.user_id;

      // Fetch participants for matching
      const { data: participants } = await serviceClient.from("meeting_participants").select("user_id").eq("meeting_id", id);
      const userIds = participants?.map((p: any) => p.user_id) || [];
      
      let scholarsData: any[] = [];
      if (userIds.length > 0) {
        const { data: schData } = await serviceClient.from("scholars").select("id, user_id, users(name)").in("user_id", userIds);
        scholarsData = schData || [];
      } else {
        const { data: allScholars } = await serviceClient.from("scholars").select("id, user_id, users(name)").eq("professor_id", meeting.professor_id);
        scholarsData = allScholars || [];
      }

      if (createdBy) {
        for (const item of result.actionItems) {
          const taskInsert = {
            title: item.title || "Action Item",
            description: item.description || "",
            created_by: createdBy,
            professor_id: meeting.professor_id,
            deadline: item.dueDate || null,
            status: "not_started",
            meeting_id: id,
            is_auto_generated: true
          };
          
          const { data: insertedTask, error: taskErr } = await serviceClient.from("tasks").insert(taskInsert).select().single();

          if (insertedTask && !taskErr) {
            let assignedScholars = scholarsData;
            
            if (item.assignee && item.assignee.toLowerCase() !== 'unassigned') {
              const matched = scholarsData.filter((s: any) => 
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
              assignees: assignedScholars.map((s: any) => s.users?.name).join(", ")
            });
          }
        }
      }
    }

    return NextResponse.json({
      summary: result.summary,
      keyPoints: result.keyPoints,
      actionItems: result.actionItems,
      followUpTopics: result.followUpTopics,
      autoCreatedTasks
    });`;

code = code.replace(/\/\/ Create action items[\s\S]*?return NextResponse.json\(\{[\s\S]*?\}\);/, replacement);

fs.writeFileSync('src/app/api/meetings/[id]/summarize/route.ts', code);
console.log("Updated summarize route.");
