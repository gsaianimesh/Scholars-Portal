const fs = require('fs');

try {
  let content = fs.readFileSync('src/app/page.tsx', 'utf8');
  
  const heroRegex = /\{\/\*\s*Hero Section\s*\*\/\}.*?(?=\{\/\*\s*Feature 1: The AI Notetaker\s*\*\/\})/s;
  
  const newHero = `{/* Hero Section */}
      <section className="relative pt-32 pb-10 lg:pt-48 lg:pb-16 overflow-hidden">
        {/* Clean, subtle background */}
        <div className="absolute top-0 left-0 w-full h-full bg-background -z-20"></div>
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent -z-10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl z-10 relative">
          <div className="group inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/40 px-5 py-2 text-sm font-medium mb-10 backdrop-blur-md transition-colors cursor-default shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Meet Your Personal AI Lab Assistant
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8">
            Research Management. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-primary bg-clip-text text-transparent pb-2">On Autopilot.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Stop juggling emails, calendars, and spreadsheets. Schedule automatically emailed meetings, track tasks seamlessly, and let our smart AI bot precisely take notes for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            {loggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  Launch Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-all hover:scale-105 border-0">
                    Set Up Your Free Lab <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-base font-bold gap-2 bg-background/50 backdrop-blur-md hover:bg-accent transition-all hover:scale-105 border-2">
                    See How It Works
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard UI Mockup - The "Wow" Factor without clutter */}
        <div className="container mx-auto px-4 max-w-6xl relative z-20 perspective-[2000px]">
           {/* Decorative Glow entirely behind the dashboard */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-[100px] -z-10 rounded-full animate-pulse duration-[4000ms]"></div>
           
           {/* 3D Tilted App Window */}
           <div className="relative rounded-2xl md:rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl shadow-2xl overflow-hidden group transform-gpu rotate-x-[5deg] hover:rotate-x-0 transition-transform duration-700 ease-out">
              {/* Fake Window Header bars */}
              <div className="h-12 border-b border-border/50 flex items-center px-4 gap-2 bg-muted/50 backdrop-blur-md">
                 <div className="w-3 h-3 rounded-full bg-red-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div></div>
                 <div className="mx-auto text-xs font-semibold text-muted-foreground w-full text-center pr-10">Scholar Portal Workspace</div>
              </div>

              {/* Inside Dashboard Canvas */}
              <div className="p-4 md:p-8 bg-muted/10 grid md:grid-cols-3 gap-6 relative">
                 {/* Main AI Feed Action */}
                 <div className="md:col-span-2 space-y-4">
                    <div className="bg-background rounded-xl border p-5 shadow-sm transform transition-all group-hover:-translate-y-1 hover:border-primary/50 cursor-default">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600"><Bot className="h-5 w-5" /></div>
                          <div>
                            <h3 className="font-bold">AI Note Extracted</h3>
                            <p className="text-xs text-muted-foreground">From Weekly Sync • 2 mins ago</p>
                          </div>
                        </div>
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">New</span>
                      </div>
                      <p className="text-sm font-medium text-foreground/80 mb-4 pl-3 border-l-2 border-primary/20">
                        &quot;Make sure to assign the literature review updates to Michael and have it ready by Friday.&quot;
                      </p>
                      <div className="bg-muted/50 rounded-lg border p-3 flex justify-between items-center">
                         <div className="flex items-center gap-2 text-sm font-semibold">
                            <CheckSquare className="h-4 w-4 text-emerald-500" /> Auto-task Created
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-bold">MJ</div>
                           <span className="text-xs font-medium">Michael</span>
                         </div>
                      </div>
                    </div>

                    <div className="bg-background rounded-xl border p-5 shadow-sm opacity-60 transform transition-all group-hover:opacity-100 cursor-default">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600"><Mic className="h-5 w-5" /></div>
                           <h3 className="font-bold text-sm">Bot is currently recording &quot;Project Alpha Sync&quot;...</h3>
                        </div>
                        <div className="flex gap-1">
                          <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce delay-150"></span>
                          <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce delay-300"></span>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Sidebar Activity */}
                 <div className="space-y-4">
                   <div className="bg-background rounded-xl border p-5 shadow-sm transform transition-all group-hover:-translate-y-1 hover:border-orange-500/50 cursor-default">
                      <div className="p-2 bg-orange-500/10 w-fit rounded-lg text-orange-600 mb-3"><Calendar className="h-5 w-5" /></div>
                      <h3 className="font-bold text-sm mb-1">Emails Sent</h3>
                      <p className="text-xs text-muted-foreground mb-3">Invitations for tomorrow&apos;s meeting delivered successfully to students.</p>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-full bg-orange-500 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                      </div>
                   </div>

                   <div className="bg-background rounded-xl border p-5 shadow-sm transform transition-all group-hover:-translate-y-1 hover:border-blue-500/50 cursor-default">
                      <div className="p-2 bg-blue-500/10 w-fit rounded-lg text-blue-600 mb-3"><UserPlus className="h-5 w-5" /></div>
                      <h3 className="font-bold text-sm mb-1">New Scholar Added</h3>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="w-6 h-6 rounded-full bg-emerald-500 text-[10px] text-white flex items-center justify-center font-bold shadow-sm">DK</div>
                         <p className="text-xs text-muted-foreground font-medium">Joined via Invite Code</p>
                      </div>
                   </div>
                 </div>

                 {/* Gradient Overlay for bottom blending */}
                 <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none rounded-b-[2rem]"></div>
              </div>
           </div>
        </div>
      </section>

      `;
  
  if (heroRegex.test(content)) {
      content = content.replace(heroRegex, newHero);
      fs.writeFileSync('src/app/page.tsx', content);
      console.log("Successfully replaced hero section");
  } else {
      console.log("Could not find hero regex match");
  }
} catch (e) {
  console.error("Error:", e);
}
