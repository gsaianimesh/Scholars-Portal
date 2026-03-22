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

    const systemPrompt = {
      role: "system",
      content: `You are Lumi, a brilliant and friendly AI lab assistant for Researchify.
You have tools to BOTH create AND retrieve data. Use them appropriately:
- When user asks to CREATE a task or schedule a meeting: use create_task or schedule_meeting tools.
- When user asks about their EXISTING meetings, schedule, or calendar: use get_meetings tool.
- When user asks about their EXISTING tasks, assignments, or to-dos: use get_tasks tool.

IMPORTANT: Always use the appropriate tool instead of guessing or saying you don't have access. If the user asks "show my meetings" or "what meetings do I have", you MUST call get_meetings.

For professors, you can assign tasks to scholars using their IDs. Available Scholars:\n${scholarOptionsStr || "None"}.
For scholars, the task or meeting is assigned to themselves or their professor.
Be extremely brief. Confirm success via text after any tool is called.`
    };

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
        tools: [
          {
            type: "function",
            function: {
              name: "create_task",
              description: "Creates a new task in the database.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "The title of the task" },
                  description: { type: "string", description: "Task details" },
                  scholar_id: { type: "string", description: "The ID of the scholar this belongs to. If scholar, leave empty (auto resolved)" }
                },
                required: ["title"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "schedule_meeting",
              description: "Creates a new meeting.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Title of the meeting" },
                  date: { type: "string", description: "Date/Time in ISO format" },
                  duration_minutes: { type: "number", description: "Duration in minutes (default 60)" },
                  agenda: { type: "string", description: "Meeting agenda (optional)" }
                },
                required: ["title", "date"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_meetings",
              description: "Retrieves upcoming meetings from the database. Use this when user asks about their meetings, schedule, or calendar.",
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
              description: "Retrieves tasks from the database. Use this when user asks about their tasks, assignments, or to-dos.",
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
        ],
        tool_choice: "auto"
      }),
    });

    const data = await response.json();
    const msg = data.choices[0]?.message;

    if (msg?.tool_calls) {
      let responseText = "Action completed successfully!";
      for (const toolCall of msg.tool_calls) {
        if (toolCall.function.name === "create_task") {
          const args = JSON.parse(toolCall.function.arguments);
          const targetScholarId = args.scholar_id || scholarId;
          
          if (profId) {
            const { data: tData } = await supabase.from("tasks").insert({
               title: args.title,
               description: args.description || "",
               professor_id: profId,
               created_by: appUser.id
            }).select().single();
            
            if (tData && targetScholarId) {
               await supabase.from("task_assignments").insert({ task_id: tData.id, scholar_id: targetScholarId });
               responseText = `Task "**${args.title}**" has been created.`;
            } else if (tData) {
               responseText = `Global Task "**${args.title}**" has been created for your domain.`;
            }
          }
        } else if (toolCall.function.name === "schedule_meeting") {
          const args = JSON.parse(toolCall.function.arguments);
          if (profId) {
             const dt = new Date(args.date);
             const durationMins = args.duration_minutes || 60;
             const { error } = await supabase.from("meetings").insert({
                meeting_title: args.title,
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
          }
        } else if (toolCall.function.name === "get_meetings") {
          const args = JSON.parse(toolCall.function.arguments);
          const limit = args.limit || 5;
          if (profId) {
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
          } else {
            responseText = "I couldn't find your professor profile to fetch meetings.";
          }
        } else if (toolCall.function.name === "get_tasks") {
          const args = JSON.parse(toolCall.function.arguments);
          const limit = args.limit || 10;
          if (profId) {
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
