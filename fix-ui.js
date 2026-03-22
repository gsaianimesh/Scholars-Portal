const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/meetings/[id]/page.tsx', 'utf8');

// Replace all instances of the insights block with nothing
while (code.includes('            {preMeetingContext.insights && (')) {
    const startIndex = code.indexOf('            {preMeetingContext.insights && (\n              <div className="mt-4 pt-4 border-t border-primary/20">');
    if (startIndex === -1) break;
    // Find the next `            )}` after the startIndex
    let endIndex = code.indexOf('            )}\n          </CardContent>', startIndex);
    if (endIndex === -1) {
       endIndex = code.indexOf('            )}\n', startIndex + 500); // 500 characters safety
    }
    
    if (endIndex !== -1) {
       code = code.substring(0, startIndex) + code.substring(endIndex + 15);
    } else {
       break;
    }
}

// Clean up any remaining partials
code = code.replace(/\{preMeetingContext\.insights && \([\s\S]*?AI Meeting Insights \(Groq\)[\s\S]*?<\/div>[\s\n]*\)\}/g, '');

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

code = code.replace('<CardContent className="space-y-4">', '<CardContent className="space-y-4">\n' + newInsightsBlock);

fs.writeFileSync('src/app/dashboard/meetings/[id]/page.tsx', code);
