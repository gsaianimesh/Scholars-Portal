const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const oldStr = `                <div className="space-y-2">
                  <Label htmlFor="fathomApiKey">Fathom API Key</Label>
                  <Input
                    id="fathomApiKey"
                    type="password"
                    placeholder="Enter your Fathom API key..."
                    value={fathomApiKey}
                    onChange={(e) => setFathomApiKey(e.target.value)}
                  />
                </div>`;

const newStr = `                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                    <div>
                      <h4 className="font-semibold select-none">Connect with Fathom</h4>
                      <p className="text-sm text-muted-foreground">Authorize Scholars Portal to access your recordings automatically.</p>
                    </div>
                    <Button variant="default" onClick={() => window.location.href = '/api/auth/fathom/login'} className="shrink-0 group">
                       <svg className="w-5 h-5 mr-2 group-hover:drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#00BEFF"/><path d="M11 17L15.3333 10.5H12.0833L13.1667 7L8.83333 13.5H12.0833L11 17Z" fill="white"/></svg>
                      {fathomApiKey && fathomApiKey.length > 30 ? "Reconnect Fathom" : "Connect Fathom"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">OR ENTER API KEY MANUALLY</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fathomApiKey">Fathom API Key</Label>
                    <Input
                      id="fathomApiKey"
                      type="password"
                      placeholder="Enter your Fathom API key..."
                      value={fathomApiKey}
                      onChange={(e) => setFathomApiKey(e.target.value)}
                    />
                  </div>
                </div>`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/app/dashboard/settings/page.tsx', content);
