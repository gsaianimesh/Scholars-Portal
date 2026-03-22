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
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
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

    // Fetch context data
    let contextData = "";
    if (appUser.role === "professor") {
      const { data: prof } = await supabase.from("professors").select("id").eq("user_id", appUser.id).single();
      if (prof) {
        const [scholars, meetings, tasks] = await Promise.all([
          supabase.from("scholars").select("users(name, email)").eq("professor_id", prof.id),
          supabase.from("meetings").select("meeting_title, meeting_date, format").eq("professor_id", prof.id).order("meeting_date", { ascending: false }).limit(5),
          supabase.from("tasks").select("title, status, deadline").eq("professor_id", prof.id).limit(10)
        ]);
        contextData = `
User Role: Professor (Supervisor)
Name: ${appUser.name}
Your Scholars: ${scholars.data?.map(s => (s.users as any)?.name).join(', ') || 'None'}
Your Recent/Upcoming Meetings: ${JSON.stringify(meetings.data || [])}
Your Recent Tasks: ${JSON.stringify(tasks.data || [])}
        `;
      }
    } else {
      const { data: scholar } = await supabase.from("scholars").select("id, professor_id").eq("user_id", appUser.id).single();
      if (scholar) {
        const [meetings, tasks] = await Promise.all([
          supabase.from("meeting_participants").select("meetings(meeting_title, meeting_date)").eq("user_id", appUser.id).limit(5),
          supabase.from("task_assignments").select("tasks(title, deadline), status").eq("scholar_id", scholar.id).limit(10)
        ]);
        contextData = `
User Role: Scholar (Student/Researcher)
Name: ${appUser.name}
Your Recent/Upcoming Meetings: ${JSON.stringify(meetings.data?.map((m: any) => m.meetings) || [])}
Your Assigned Tasks: ${JSON.stringify(tasks.data?.map((t: any) => ({...t.tasks, status: t.status})) || [])}
        `;
      }
    }

    const systemPrompt = {
      role: "system",
      content: `You are Lumi, a cute, helpful, friendly, and highly intelligent AI lab assistant for the Researchify platform.
You help researchers (professors) and scholars manage their academic workflow seamlessly.
Use the following real-time database context about the current user to answer their questions accurately. If they ask about their tasks, scholars, or meetings, use this provided JSON data to answer them factually.
Be concise. Keep output to short, readable plain-text markdown. Don't invent tasks or meetings that aren't in the provided context, but be friendly and polite.

--- CURRENT USER DB CONTEXT ---
${contextData}
--- END CONTEXT ---`
    };

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API key configured" }, { status: 500 });
    }

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
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
       const text = await response.text();
       throw new Error(`Groq API Error: ${text}`);
    }

    const data = await response.json();
    return NextResponse.json({ text: data.choices[0]?.message?.content || "" });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to generate reply" }, { status: 500 });
  }
}
