const SYSTEM_PROMPT = `You are an expert academic meeting summarizer. Your role is to analyze meeting transcripts between professors and research scholars, then produce structured summaries.

You must return a JSON object with the following structure:
{
  "summary": "A comprehensive narrative summary of the meeting (2-4 paragraphs)",
  "keyPoints": ["Array of key discussion points and decisions"],
  "actionItems": [
    {
      "title": "Short action item title",
      "description": "Detailed description of what needs to be done",
      "assignee": "Name of the person responsible (or 'unassigned')",
      "dueDate": "YYYY-MM-DD or null"
    }
  ],
  "followUpTopics": ["Array of topics to revisit in the next meeting"]
}

Guidelines:
- Capture all research-related decisions and agreements
- Identify specific action items with responsible parties when mentioned
- Note any deadlines or milestones discussed
- Highlight any concerns or blockers raised
- Be concise but thorough
- Very Important: If a specific due date is not mentioned for an action item, you must estimate a realistic due date based on the task's severity and complexity (e.g. 1-2 days for quick tasks, 1 week for normal, 2 weeks for complex research tasks). Calculate this date relative to the Current Date provided in the prompt. Do not leave it null unless absolutely impossible.
`;

export interface MeetingSummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems: {
    title: string;
    description: string;
    assignee: string;
    dueDate: string | null;
  }[];
  followUpTopics: string[];
}

export async function summarizeMeeting(
  transcript: string,
  agenda?: string | null,
  previousSummary?: string | null,
  currentDateStr?: string
): Promise<MeetingSummaryResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("No AI API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  const isGroq = !!process.env.GROQ_API_KEY;
  const baseUrl = isGroq
    ? "https://api.groq.com/openai/v1"
    : "https://api.openai.com/v1";
  const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

  let userContent = "";
  if (currentDateStr) {
    userContent += `Current Date: ${currentDateStr}\n\n`;
  }
  if (agenda) {
    userContent += `Meeting Agenda:\n${agenda}\n\n`;
  }
  if (previousSummary) {
    userContent += `Previous Meeting Summary (for context):\n${previousSummary}\n\n`;
  }
  userContent += `Meeting Transcript:\n${transcript}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in AI response");
  }

  const parsed: MeetingSummaryResult = JSON.parse(content);
  return parsed;
}

const ACTION_ITEMS_SYSTEM_PROMPT = `You are an expert academic meeting assistant. Your role is to analyze meeting transcripts and summaries to extract action items.

You must return a JSON object with the following structure:
{
  "actionItems": [
    {
      "title": "Short action item title",
      "description": "Detailed description of what needs to be done",
      "assignee": "Name of the person responsible (or 'unassigned')",
      "dueDate": "YYYY-MM-DD or null"
    }
  ]
}

Guidelines:
- Identify specific action items with responsible parties when mentioned.
- Note any deadlines or milestones discussed.
- Very Important: If a specific due date is not mentioned for an action item, you must estimate a realistic due date based on the task's severity and complexity (e.g. 1-2 days for quick tasks, 1 week for normal, 2 weeks for complex research tasks). Calculate this date relative to the Current Date provided in the prompt. Do not leave it null unless absolutely impossible.
`;

export interface ActionItemsResult {
  actionItems: {
    title: string;
    description: string;
    assignee: string;
    dueDate: string | null;
  }[];
}

export async function extractActionItems(
  transcript: string,
  summary: string,
  agenda?: string | null,
  currentDateStr?: string
): Promise<ActionItemsResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("No AI API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  const isGroq = !!process.env.GROQ_API_KEY;
  const baseUrl = isGroq
    ? "https://api.groq.com/openai/v1"
    : "https://api.openai.com/v1";
  const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

  let userContent = "";
  if (currentDateStr) {
    userContent += `Current Date: ${currentDateStr}\n\n`;
  }
  if (agenda) {
    userContent += `Meeting Agenda:\n${agenda}\n\n`;
  }
  if (summary) {
    userContent += `Meeting Summary:\n${summary}\n\n`;
  }
  userContent += `Meeting Transcript:\n${transcript}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: ACTION_ITEMS_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in AI response");
  }

  const parsed: ActionItemsResult = JSON.parse(content);
  return parsed;
}

const INSIGHTS_SYSTEM_PROMPT = `You are an expert academic advisor. Your role is to suggest talking points and a brief summary for an upcoming meeting between a professor and their research scholars.

You will be given the summary of the previous meeting and the status of recent tasks assigned to the scholars. 

You must return a JSON object with the following structure:
{
  "talkingPoints": ["Array of 3-5 specific, actionable points to discuss in the upcoming meeting"],
  "briefSummary": "A very short (1-2 sentences) overview of where the project currently stands based on the provided context."
}
`;

export interface MeetingInsightsResult {
  talkingPoints: string[];
  briefSummary: string;
}

export async function generateMeetingInsights(
  previousSummary: string,
  pendingTasks: any[],
  recentSubmissions: any[]
): Promise<MeetingInsightsResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("No AI API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  const isGroq = !!process.env.GROQ_API_KEY;
  const baseUrl = isGroq
    ? "https://api.groq.com/openai/v1"
    : "https://api.openai.com/v1";
  const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

  let userContent = "";
  if (previousSummary) {
    userContent += `Previous Meeting Summary:\n${previousSummary}\n\n`;
  }
  if (pendingTasks && pendingTasks.length > 0) {
    userContent += `Pending Tasks:\n${JSON.stringify(pendingTasks, null, 2)}\n\n`;
  }
  if (recentSubmissions && recentSubmissions.length > 0) {
    userContent += `Recent Submissions/Completed Tasks:\n${JSON.stringify(recentSubmissions, null, 2)}\n\n`;
  }

  if (!userContent) {
    userContent = "No previous context available. Just suggest general checking-in points.";
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: INSIGHTS_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in AI response");
  }

  const parsed: MeetingInsightsResult = JSON.parse(content);
  return parsed;
}
