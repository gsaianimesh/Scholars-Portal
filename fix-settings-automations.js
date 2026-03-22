const fs = require('fs');

const file = 'src/app/dashboard/settings/page.tsx';
let code = fs.readFileSync(file, 'utf-8');

// First, inject state variables for toggles at the top of the component
// Find the last useState
const stateInj = `const [fathomApiKey, setFathomApiKey] = useState("");
  const [autoMeetingSync, setAutoMeetingSync] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);
  const [autoTaskGen, setAutoTaskGen] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);`;

code = code.replace(/const \[fathomApiKey, setFathomApiKey\] = useState\(""\);/, stateInj);

const importsInj = `import { Copy, Check, Link as LinkIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";`

code = code.replace(/import { Copy, Check, Link as LinkIcon } from "lucide-react";/, importsInj);

// Now, insert the Automation Toggles Card before the final Save Changes button.
// Well, there is a Fathom integrations card, and a Save Changes button container at the bottom.
// I'll just append it right after the Fathom Card, which ends with `</Card>` before the Save Changes section.

const fathomCardEndStr = `          </Card>
        )}

        <div className="flex justify-end gap-4 mt-8">`;

const automationsCard = `          </Card>
        )}

        {/* Global Automations Preferences */}
        <Card className="border-primary/10 shadow-sm mt-6">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle>Automation Preferences</CardTitle>
            <CardDescription>
              Toggle specific AI and workflow automations entirely on or off for your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-sync Calendar Meetings</Label>
                <p className="text-sm text-muted-foreground">Automatically fetch and schedule meetings from Google Calendar / Fathom into your dashboard.</p>
              </div>
              <Switch checked={autoMeetingSync} onCheckedChange={setAutoMeetingSync} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">AI Meeting Summaries</Label>
                <p className="text-sm text-muted-foreground">Generate comprehensive summaries, expected context, and transcripts automatically using Groq.</p>
              </div>
              <Switch checked={aiInsights} onCheckedChange={setAiInsights} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Automated Task Generation</Label>
                <p className="text-sm text-muted-foreground">Extract action items from meetings and automatically assign them to specific scholars.</p>
              </div>
              <Switch checked={autoTaskGen} onCheckedChange={setAutoTaskGen} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
               <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send automated email briefings and reminders to participants before and after meetings.</p>
              </div>
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-8">`;

code = code.replace(fathomCardEndStr, automationsCard);

fs.writeFileSync(file, code);
console.log('Done automations settings');
