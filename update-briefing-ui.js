const fs = require('fs');

let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

// The original insights block starts at "{preMeetingContext.insights && (" and ends at "</div>\n            )}"
const oldInsightsBlock = `            {preMeetingContext.insights && (
              <div className="mt-4 pt-4 border-t border-primary/20">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Meeting Insights (Groq)</span>
                </div>
                {preMeetingContext.insights.briefSummary && (
                  <p className="text-sm mb-3 text-muted-foreground">
                    {preMeetingContext.insights.briefSummary}
                  </p>
                )}
                {preMeetingContext.insights.talkingPoints?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Discussion Points</p>
                    <ul className="space-y-1.5">
                      {preMeetingContext.insights.talkingPoints.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}`;

code = code.replace(oldInsightsBlock, '');

const newInsightsBlock = `            {preMeetingContext.insights && (
              <div className="mb-6 pb-6 border-b border-primary/20">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <Brain className="h-4 w-4" />
                  <span>Probable things to discuss</span>
                </div>
                {preMeetingContext.insights.briefSummary && (
                  <p className="text-sm mb-3 text-muted-foreground">
                    {preMeetingContext.insights.briefSummary}
                  </p>
                )}
                {preMeetingContext.insights.talkingPoints?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Discussion Points</p>
                    <ul className="space-y-1.5">
                      {preMeetingContext.insights.talkingPoints.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
`;

// Insert it at the top of CardContent
const cardContentStart = `<CardContent className="space-y-4">`;
code = code.replace(cardContentStart, cardContentStart + '\n' + newInsightsBlock);

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
