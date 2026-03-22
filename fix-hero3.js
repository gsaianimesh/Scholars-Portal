const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf-8');

// Replace everything between container... and </section>
const startToken = '{/* Dashboard UI Mockup - The "Wow" Factor without clutter */}';
const startIndex = code.indexOf(startToken);

// The section following Dashboard UI Mockup ends with </section> so I will just slice up to the first </section> after startToken.
const endToken = '</section>';
const endIndex = code.indexOf(endToken, startIndex);

const before = code.slice(0, startIndex);
const after = code.slice(endIndex);

const newHeroMockup = `{/* Platform Overview Video */}
        <div className="container mx-auto px-4 max-w-6xl relative z-20 mt-16 pb-12">
          <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-2 shadow-2xl overflow-hidden ring-1 ring-white/10 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-primary/20 blur-[120px] -z-10 rounded-full animate-pulse duration-[5000ms]"></div>
            
            <div className="relative w-full overflow-hidden rounded-xl bg-muted aspect-video shadow-inner">
              <iframe
                src="https://www.loom.com/embed/9e589b374568469d9c1395a2882500d6?sid=5ef57ba2-7db5-4e78-bad6-8b3684bcbefb&hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
                frameBorder="0"
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                allowFullScreen={true}
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      `;

fs.writeFileSync('src/app/page.tsx', before + newHeroMockup + after);
console.log('Done replacement');
