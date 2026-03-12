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
      "dueDate": "YYYY-MM-DD or null if no deadline mentioned"
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
- Infer due dates from context when possible (e.g., "by next week")
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
  previousSummary?: string | null
): Promise<MeetingSummaryResult> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("No AI API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }

  const isGroq = !!process.env.GROQ_API_KEY;
  const baseUrl = isGroq
    ? "https://api.groq.com/openai/v1"
    : "https://api.openai.com/v1";
  const model = isGroq ? "llama-3.1-70b-versatile" : "gpt-4o-mini";

  let userContent = "";
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
