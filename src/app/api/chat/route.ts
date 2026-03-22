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
If the user asks you to create a task, schedule a meeting, assign something, DO NOT output plain text confirming it—you MUST use the provided tool!
For professors, you can assign tools to scholars using their IDs. Available Scholars:\n${scholarOptionsStr || "None"}.
For scholars, the task or meeting is assigned to themselves or their professor.
Be extremely brief. Confirm success via text after the tool is called.`
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
                  date: { type: "string", description: "Date/Time in ISO format" }
                },
                required: ["title", "date"]
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
            const { data: tData, error } = await supabase.from("tasks").insert({
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
             const endDt = new Date(dt.getTime() + 60*60*1000); // +1 hr
             await supabase.from("meetings").insert({
                meeting_title: args.title,
                meeting_date: dt.toISOString(),
                start_time: dt.toISOString(),
                end_time: endDt.toISOString(),
                format: "online",
                professor_id: profId,
                created_by: appUser.id
             });
             responseText = `Meeting "**${args.title}**" scheduled!`;
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
