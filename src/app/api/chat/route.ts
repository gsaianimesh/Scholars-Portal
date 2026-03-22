import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: "", ...options }); } catch {} },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { data: appUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!appUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure we know the user's relational ID
    let profId = null;
    let scholarId = null;
    let scholarOptionsStr = "";

    if (appUser.role === "professor") {
      const { data: prof } = await supabase.from("professors").select("id").eq("user_id", appUser.id).single();
      if (prof) {
        profId = prof.id;
        const { data: scholars } = await supabase.from("scholars").select("id, users(name)").eq("professor_id", profId);
        if (scholars) {
          scholarOptionsStr = scholars.map((s:any) => `ID: ${s.id}, Name: ${s.users.name}`).join(" | ");
        }
      }
    } else {
      const { data: scholar } = await supabase.from("scholars").select("id, professor_id").eq("user_id", appUser.id).single();
      if (scholar) {
        scholarId = scholar.id;
        profId = scholar.professor_id;
      }
    }

    const isProfessor = appUser.role === "professor";

    // Different system prompts for professors vs scholars
    const systemPrompt = {
      role: "system",
      content: isProfessor
        ? `You are Lumi, a brilliant and friendly AI lab assistant for Researchify.

You help professors manage their research lab. You have tools to create AND retrieve data.

CREATING TASKS:
When a professor wants to create a task, ALWAYS ask for these details BEFORE creating:
1. Task title (required)
2. Description/details (ask what the task involves)
3. Who to assign it to (show available scholars: ${scholarOptionsStr || "None"})
4. Deadline (optional but recommended)

Only call create_task AFTER you have gathered sufficient information. Don't create tasks with just a title.

CREATING MEETINGS:
When scheduling a meeting, ask for:
1. Meeting title
2. Date and time
3. Duration (default 60 mins)
4. Agenda (optional)

RETRIEVING DATA:
- Use get_meetings when they ask about their schedule/meetings
- Use get_tasks when they ask about tasks/assignments

Available Scholars: ${scholarOptionsStr || "None"}

Be friendly, helpful, and confirm actions after completing them.`
        : `You are Lumi, a friendly AI assistant for Researchify.

You help scholars track their work. You can ONLY view information - you cannot create tasks or meetings.

When a scholar asks to create a task or meeting, politely explain that only professors can create tasks and meetings. Suggest they contact their professor instead.

WHAT YOU CAN DO:
- Use get_meetings to show their upcoming meetings
- Use get_tasks to show their assigned tasks and deadlines
- Answer questions about their schedule and workload

Be supportive and helpful!`
    };

    // Define tools based on user role
    const scholarTools = [
      {
        type: "function",
        function: {
          name: "get_meetings",
          description: "Retrieves upcoming meetings the scholar is invited to.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Maximum number of meetings to return (default 5)" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_tasks",
          description: "Retrieves tasks assigned to the scholar.",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Filter by status: not_started, in_progress, completed, submitted (optional)" },
              limit: { type: "number", description: "Maximum number of tasks to return (default 10)" }
            },
            required: []
          }
        }
      }
    ];

    const professorTools = [
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Creates a new task. Only call this after gathering all details from the professor.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title of the task" },
              description: { type: "string", description: "Detailed task description" },
              scholar_id: { type: "string", description: "The ID of the scholar to assign this to" },
              deadline: { type: "string", description: "Deadline in ISO format (optional)" }
            },
            required: ["title", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "schedule_meeting",
          description: "Creates a new meeting. Only call this after gathering all details.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Title of the meeting" },
              date: { type: "string", description: "Date/Time in ISO format" },
              duration_minutes: { type: "number", description: "Duration in minutes (default 60)" },
              agenda: { type: "string", description: "Meeting agenda" }
            },
            required: ["title", "date"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_meetings",
          description: "Retrieves upcoming meetings from the database.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Maximum number of meetings to return (default 5)" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_tasks",
          description: "Retrieves tasks from the database.",
          parameters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Filter by status: not_started, in_progress, completed, submitted (optional)" },
              limit: { type: "number", description: "Maximum number of tasks to return (default 10)" }
            },
            required: []
          }
        }
      }
    ];

    const tools = isProfessor ? professorTools : scholarTools;

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const isGroq = !!process.env.GROQ_API_KEY;
    const baseUrl = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [systemPrompt, ...messages],
        temperature: 0.5,
        max_tokens: 500,
        tools,
        tool_choice: "auto"
      }),
    });

    const data = await response.json();
    const msg = data.choices[0]?.message;

    if (msg?.tool_calls) {
      let responseText = "Action completed successfully!";
      for (const toolCall of msg.tool_calls) {
        // Safely parse arguments with fallback to empty object
        let args: any = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}") || {};
        } catch {
          args = {};
        }

        if (toolCall.function.name === "create_task") {
          // Only professors can create tasks
          if (!isProfessor) {
            responseText = "Sorry, only professors can create tasks. Please contact your professor to create tasks for you.";
            continue;
          }

          const targetScholarId = args.scholar_id || null;

          if (profId) {
            const taskData: any = {
               title: args.title || "Untitled Task",
               description: args.description || "",
               professor_id: profId,
               created_by: appUser.id
            };

            // Add deadline if provided
            if (args.deadline) {
              taskData.deadline = new Date(args.deadline).toISOString();
            }

            const { data: tData, error } = await supabase.from("tasks").insert(taskData).select().single();

            if (error) {
              responseText = `Sorry, I couldn't create the task: ${error.message}`;
            } else if (tData && targetScholarId) {
               await supabase.from("task_assignments").insert({ task_id: tData.id, scholar_id: targetScholarId });
               responseText = `Task "**${args.title}**" has been created and assigned successfully!`;
            } else if (tData) {
               responseText = `Task "**${args.title}**" has been created. You can assign it to scholars from the Tasks page.`;
            }
          }
        } else if (toolCall.function.name === "schedule_meeting") {
          // Only professors can schedule meetings
          if (!isProfessor) {
            responseText = "Sorry, only professors can schedule meetings. Please contact your professor to schedule a meeting.";
            continue;
          }

          if (profId && args.date) {
             const dt = new Date(args.date);
             const durationMins = args.duration_minutes || 60;
             const { error } = await supabase.from("meetings").insert({
                meeting_title: args.title || "Untitled Meeting",
                meeting_date: dt.toISOString(),
                duration_minutes: durationMins,
                agenda: args.agenda || null,
                professor_id: profId
             });
             if (error) {
               responseText = `Sorry, I couldn't create the meeting: ${error.message}`;
             } else {
               responseText = `Meeting "**${args.title}**" scheduled for **${dt.toLocaleString()}**!`;
             }
          } else {
            responseText = "I need a date and time to schedule the meeting. When would you like to schedule it?";
          }
        } else if (toolCall.function.name === "get_meetings") {
          const limit = args.limit || 5;

          if (isProfessor && profId) {
             // Professor: get all their meetings
             const { data: meetings, error } = await supabase
               .from("meetings")
               .select("id, meeting_title, meeting_date, duration_minutes, agenda, meeting_link")
               .eq("professor_id", profId)
               .gte("meeting_date", new Date().toISOString())
               .order("meeting_date", { ascending: true })
               .limit(limit);

             if (error) {
               responseText = `Sorry, I couldn't fetch meetings: ${error.message}`;
             } else if (!meetings || meetings.length === 0) {
               responseText = "You don't have any upcoming meetings scheduled.";
             } else {
               const meetingList = meetings.map((m: any) => {
                 const date = new Date(m.meeting_date);
                 return `- **${m.meeting_title}** on ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
               }).join("\n");
               responseText = `Here are your upcoming meetings:\n\n${meetingList}`;
             }
          } else if (scholarId) {
             // Scholar: get meetings they are invited to
             const { data: participations } = await supabase
               .from("meeting_participants")
               .select("meeting_id")
               .eq("user_id", appUser.id);

             const meetingIds = participations?.map((p: any) => p.meeting_id) || [];

             if (meetingIds.length === 0) {
               responseText = "You don't have any upcoming meetings scheduled.";
             } else {
               const { data: meetings, error } = await supabase
                 .from("meetings")
                 .select("id, meeting_title, meeting_date, duration_minutes")
                 .in("id", meetingIds)
                 .gte("meeting_date", new Date().toISOString())
                 .order("meeting_date", { ascending: true })
                 .limit(limit);

               if (error) {
                 responseText = `Sorry, I couldn't fetch meetings: ${error.message}`;
               } else if (!meetings || meetings.length === 0) {
                 responseText = "You don't have any upcoming meetings scheduled.";
               } else {
                 const meetingList = meetings.map((m: any) => {
                   const date = new Date(m.meeting_date);
                   return `- **${m.meeting_title}** on ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                 }).join("\n");
                 responseText = `Here are your upcoming meetings:\n\n${meetingList}`;
               }
             }
          } else {
            responseText = "I couldn't find your profile to fetch meetings.";
          }
        } else if (toolCall.function.name === "get_tasks") {
          const limit = args.limit || 10;

          if (isProfessor && profId) {
             // Professor: get all tasks in their domain
             let query = supabase
               .from("tasks")
               .select("id, title, description, status, deadline, created_at")
               .eq("professor_id", profId)
               .order("created_at", { ascending: false })
               .limit(limit);

             if (args.status) {
               query = query.eq("status", args.status);
             }

             const { data: tasks, error } = await query;

             if (error) {
               responseText = `Sorry, I couldn't fetch tasks: ${error.message}`;
             } else if (!tasks || tasks.length === 0) {
               responseText = args.status
                 ? `You don't have any tasks with status "${args.status}".`
                 : "You don't have any tasks yet.";
             } else {
               const taskList = tasks.map((t: any) => {
                 const deadlineStr = t.deadline ? ` (due: ${new Date(t.deadline).toLocaleDateString()})` : "";
                 return `- **${t.title}** [${t.status}]${deadlineStr}`;
               }).join("\n");
               responseText = `Here are your tasks:\n\n${taskList}`;
             }
          } else if (scholarId) {
             // Scholar: get their assigned tasks
             let query = supabase
               .from("task_assignments")
               .select("id, status, task:tasks(id, title, description, deadline)")
               .eq("scholar_id", scholarId)
               .order("id", { ascending: false })
               .limit(limit);

             if (args.status) {
               query = query.eq("status", args.status);
             }

             const { data: assignments, error } = await query;

             if (error) {
               responseText = `Sorry, I couldn't fetch tasks: ${error.message}`;
             } else if (!assignments || assignments.length === 0) {
               responseText = args.status
                 ? `You don't have any tasks with status "${args.status}".`
                 : "You don't have any assigned tasks yet.";
             } else {
               const taskList = assignments.map((a: any) => {
                 const t = a.task;
                 const deadlineStr = t?.deadline ? ` (due: ${new Date(t.deadline).toLocaleDateString()})` : "";
                 return `- **${t?.title || "Untitled"}** [${a.status}]${deadlineStr}`;
               }).join("\n");
               responseText = `Here are your assigned tasks:\n\n${taskList}`;
             }
          } else {
            responseText = "I couldn't find your profile to fetch tasks.";
          }
        }
      }
      return NextResponse.json({ text: responseText + " Is there anything else you need?" });
    }

    return NextResponse.json({ text: msg?.content || "" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
