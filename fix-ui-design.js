const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

// Add Clock to imports
if (code.includes('lucide-react') && !code.includes('Clock,')) {
    code = code.replace(/import \{ (.*?) \} from "lucide-react";/, 'import { $1, Clock } from "lucide-react";');
}

// 1. Rewrite the Top Header Area
const oldHeaderStart = `<div className="flex items-center gap-4">`;
const oldHeaderEndBytesString = `        </div>
      </div>

      {/* Reschedule Dialog */}`;

const startIdx = code.indexOf(oldHeaderStart);
const endIdx = code.indexOf(oldHeaderEndBytesString, startIdx) + oldHeaderEndBytesString.length - '      {/* Reschedule Dialog */}'.length;

if (startIdx !== -1 && endIdx > startIdx) {
    const oldHeader = code.slice(startIdx, endIdx);
    const newHeader = `<div>
        <Link href="/dashboard/meetings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Meetings
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{meeting.meeting_title}</h1>
              {isPast ? (
                <Badge variant="secondary">Past</Badge>
              ) : (
                <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none">Upcoming</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(meeting.meeting_date)}</span>
              <span className="text-muted-foreground/30">•</span>
              <Clock className="h-4 w-4 ml-1" />
              <span>{meeting.duration_minutes || 60} min</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {meeting.meeting_link ? (
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Video className="h-4 w-4 mr-1" />
                  Join Meeting
                </Button>
              </a>
            ) : (
              <Button disabled variant="outline">
                <Video className="h-4 w-4 mr-1" />
                Join (No Link Added)
              </Button>
            )}
            {!isPast && userRole !== "scholar" && (
              <>
                <Button variant="outline" size="sm" onClick={markCompleted} disabled={completing}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {completing ? "Completing..." : "Mark Done"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowReschedule(true)}>
                  <CalendarClock className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelMeeting}
                  disabled={cancelling}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {cancelling ? "Cancelling..." : "Cancel"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
`;
    code = code.substring(0, startIdx) + newHeader + code.substring(endIdx);
}

// 2. Overhaul the Pre-Meeting Briefing card to remove duplicates and rename to "Suggested Meeting Agenda"
const preMeetingStartStr = `{!isPast && preMeetingContext && (`;
const preMeetingEndStr = `          </CardContent>
        </Card>
      )}`;

const pmStartIdx = code.indexOf(preMeetingStartStr);
const pmEndIdx = code.indexOf(preMeetingEndStr, pmStartIdx);

if (pmStartIdx !== -1 && pmEndIdx !== -1) {
   const newPreMeetingBlock = \`{!isPast && preMeetingContext && (
        <Card className="border-primary/20 bg-primary/5 shadow-md">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Pre-Meeting Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {preMeetingContext.insights && (
              <div className="pb-5 border-b border-primary/10">
                <div className="flex items-center gap-2 text-primary font-semibold mb-3">
                  <span>Suggested Meeting Agenda</span>
                </div>
                {preMeetingContext.insights.briefSummary && (
                  <p className="text-sm mb-4 text-muted-foreground leading-relaxed">
                    {preMeetingContext.insights.briefSummary}
                  </p>
                )}
                {preMeetingContext.insights.talkingPoints?.length > 0 && (
                  <div className="bg-background/50 rounded-lg p-4 border border-primary/5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Discussion Topics</p>
                    <ul className="space-y-2">
                      {preMeetingContext.insights.talkingPoints.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="text-foreground/90 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {preMeetingContext.lastMeetingSummary ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Last Meeting Summary</p>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-background/50 border border-primary/5">
                  <ReactMarkdown>
                    {getParsedSummary(preMeetingContext.lastMeetingSummary)}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Last Meeting Summary</p>
                <p className="text-sm text-muted-foreground italic p-4 rounded-lg bg-background/50 border border-primary/5">
                  No chronological previous meeting summary found.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preMeetingContext.pendingTasks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pending Tasks</p>
                  <ul className="space-y-2">
                    {preMeetingContext.pendingTasks.map((task: any) => (
                      <li key={task.id} className="text-sm flex items-center p-2 rounded-md bg-background/50 border border-primary/5 gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {preMeetingContext.recentSubmissions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Submissions</p>
                  <ul className="space-y-2">
                    {preMeetingContext.recentSubmissions.map((sub: any) => (
                      <li key={sub.id} className="text-sm flex items-center p-2 rounded-md bg-background/50 border border-primary/5 gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="truncate">{sub.scholar_name} submitted "{sub.task_title}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}\`;
   code = code.substring(0, pmStartIdx) + newPreMeetingBlock + code.substring(pmEndIdx + preMeetingEndStr.length);
}

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
