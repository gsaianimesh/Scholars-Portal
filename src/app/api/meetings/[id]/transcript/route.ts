import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchFathomRecordingData, listFathomMeetings, FathomMeeting } from "@/lib/services/fathom";
import { extractActionItems, summarizeMeeting } from "@/lib/services/ai-summarization";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("[Transcript API] Starting transcript fetch...");
    const { id } = await params;
    console.log(`[Transcript API] Meeting ID: ${id}`);

    const supabase = createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[Transcript API] Authenticated user: ${authUser.id}`);

    let body: any = {};
    try {
      body = await request.json();
    } catch(e) {}
    const manualTranscript = body?.manualTranscript;

    const serviceClient = createServiceRoleClient();

    // Fetch meeting details including date
    const { data: meeting } = await serviceClient
      .from("meetings")
      .select("id, fathom_meeting_id, meeting_date, meeting_title, professor_id")
      .eq("id", id)
      .maybeSingle();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Fetch professor's API key if available
    let apiKey = process.env.FATHOM_API_KEY;
    if (meeting.professor_id) {
      const { data: prof } = await serviceClient
        .from("professors")
        .select("fathom_api_key")
        .eq("id", meeting.professor_id)
        .maybeSingle();
      if (prof?.fathom_api_key) {
        apiKey = prof.fathom_api_key;
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Fathom API Key is not configured for this environment or user" }, { status: 500 });
    }


    let transcript = "";
    let finalSummary = "";
    let extractedActionItems: any[] = [];

    if (manualTranscript) {
      console.log(`[Transcript API] Using manually provided transcript...`);
      transcript = manualTranscript;
      
      try {
        console.log(`[Transcript API] Generating summary and AI action items via Groq...`);
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
        console.log(`[Transcript API] No Fathom ID for meeting ${meeting.id}. Searching for match...`);
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
            console.log(`[Transcript API] Found Fathom match: ${bestMatch.id} (${bestMatch.title})`);
            fathomMeetingId = bestMatch.id;

            await serviceClient
              .from("meetings")
              .update({ fathom_meeting_id: fathomMeetingId })
              .eq("id", id);
          } else {
            console.warn(`[Transcript API] No matching Fathom recording found for ${meeting.meeting_date}`);
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

      console.log(`[Transcript API] Fetching transcript and summary for Fathom ID: ${fathomMeetingId}`);
      const fathomData = await fetchFathomRecordingData(fathomMeetingId, apiKey);
      transcript = fathomData.transcript;
      finalSummary = fathomData.summary;

      if (transcript || finalSummary) {
        try {
          console.log(`[Transcript API] Extracting action items using Groq AI...`);
          const aiResult = await extractActionItems(transcript, finalSummary, meeting.agenda, new Date().toISOString());
          if (aiResult.actionItems?.length) {
            extractedActionItems = aiResult.actionItems;
          }
        } catch (err) {
          console.error("[Transcript API] Failed to extract AI action items:", err);
        }
      }
    }

    // Save both transcript and summary to meeting
    const { error: updateError } = await serviceClient
      .from("meetings")
      .update({
        transcript,
        summary: finalSummary
      })
      .eq("id", id);

    if (updateError) {
      console.error(`[Transcript API] Failed to save data to DB:`, updateError);
      return NextResponse.json(
        { error: `Failed to save data: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Auto create Tasks out of them
    const autoCreatedTasks: any[] = [];
    if (extractedActionItems.length > 0) {
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
      
      const userIds = participants?.map((p: any) => p.user_id) || [];
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
            status: "not_started",
            meeting_id: id,
            is_auto_generated: true
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
      transcript,
      summary: finalSummary,
      actionItems: extractedActionItems,
      autoCreatedTasks
    });
  } catch (error: any) {
    console.error(`[Transcript API] Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript", details: String(error) },
      { status: 500 }
    );
  }
}
