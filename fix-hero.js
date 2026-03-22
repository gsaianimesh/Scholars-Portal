const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const heroRegex = /\{\/\*\s*Hero Section\s*\*\/\}.*?(?=\{\/\*\s*Feature 1: The AI Notetaker\s*\*\/\})/s;

const newHero = `{/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:40px_40px] opacity-50"></div>
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/10 via-background/50 to-background -z-10 blur-3xl"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[120px] -z-10 animate-pulse duration-[3000ms]"></div>
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[150px] -z-10 animate-pulse duration-[4000ms]"></div>

        {/* Floating Interactive Elements - Hidden on mobile, visible on lg */}
        <div className="hidden lg:block relative z-20">
           {/* Float 1 */}
           <div className="absolute -top-10 -left-64 transform -rotate-6 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-300 cursor-pointer bg-card/80 backdrop-blur-md border-2 border-primary/20 shadow-2xl rounded-3xl p-4 flex items-center gap-4">
             <div className="bg-purple-500/20 p-3 rounded-2xl"><Bot className="h-6 w-6 text-purple-600 dark:text-purple-400"/></div>
             <div className="pr-4">
               <p className="text-base font-bold">AI Notetaker Joined</p>
               <p className="text-sm text-muted-foreground">Ready to record meeting.</p>
             </div>
           </div>
           
           {/* Float 2 */}
           <div className="absolute top-32 -right-72 transform rotate-3 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-300 cursor-pointer bg-card/80 backdrop-blur-md border-2 border-emerald-500/30 shadow-2xl rounded-3xl p-4 flex items-center gap-4">
             <div className="bg-emerald-500/20 p-3 rounded-2xl"><CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/></div>
             <div className="pr-4">
               <p className="text-base font-bold">Tasks Extracted</p>
               <p className="text-sm text-muted-foreground">4 action items auto-assigned.</p>
             </div>
           </div>

           {/* Float 3 */}
           <div className="absolute bottom-10 -left-80 transform rotate-12 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-300 cursor-pointer bg-card/80 backdrop-blur-md border-2 border-blue-500/30 shadow-2xl rounded-3xl p-4 flex items-center gap-4">
             <div className="bg-blue-500 shadow-inner p-3 rounded-2xl text-white font-bold text-sm flex justify-center items-center h-12 w-12 border-2 border-card">MJ</div>
             <div className="pr-4">
               <p className="text-base font-bold">New Scholar Joined</p>
               <p className="text-sm text-muted-foreground">via simple invite link</p>
             </div>
           </div>

           {/* Float 4 */}
           <div className="absolute -bottom-24 -right-60 transform -rotate-3 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-300 cursor-pointer bg-card/80 backdrop-blur-md border-2 border-orange-500/30 shadow-2xl rounded-3xl p-4 flex items-center gap-4">
             <div className="bg-orange-500/20 p-3 rounded-2xl"><Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400"/></div>
             <div className="pr-4">
               <p className="text-base font-bold">Meeting Synced</p>
               <p className="text-sm text-muted-foreground">Emails sent to class.</p>
             </div>
           </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl relative z-10">
          <div className="group inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-background/50 hover:bg-primary/5 px-6 py-2.5 text-sm font-semibold text-primary mb-10 backdrop-blur-md transition-all cursor-pointer hover:scale-105 shadow-xl shadow-primary/10">
            <Sparkles className="h-4 w-4 shrink-0 transition-transform group-hover:rotate-12" />
            <span>Welcome to the future of Lab Management</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[6rem] font-black tracking-tighter leading-[1.05] mb-8">
            Run your research lab on{" "}
            <span className="relative inline-block mt-2 md:mt-0">
              <span className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-primary blur-2xl opacity-40 animate-pulse"></span>
              <span className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-primary bg-clip-text text-transparent">Autopilot.</span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
            Manage your students, schedule meetings, and let AI automatically take notes and assign tasks. <strong className="text-foreground">Zero clutter. Absolute clarity.</strong>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            {loggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full h-16 px-10 text-lg font-bold gap-3 bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary),0.7)] transition-all hover:-translate-y-1">
                  Launch Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="rounded-full h-16 px-10 text-lg font-bold gap-3 bg-foreground text-background hover:bg-foreground/90 shadow-2xl transition-all hover:-translate-y-1 hover:scale-105 border-0">
                    Start Your Free Lab <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="rounded-full h-16 px-10 text-lg font-bold gap-2 bg-background/80 backdrop-blur-md hover:bg-muted transition-all hover:scale-105 border-2">
                    See How It Works
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      `;

if (heroRegex.test(content)) {
    content = content.replace(heroRegex, newHero);
    fs.writeFileSync('src/app/page.tsx', content);
    console.log("Successfully replaced hero section");
} else {
    console.log("Could not find hero regex");
}
