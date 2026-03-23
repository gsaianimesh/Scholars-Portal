const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/chat/page.tsx', 'utf-8');

code = code.replace(
  /<h4 className="text-sm font-semibold truncate flex items-center gap-2">\s*\{contact\.name\}\s*\{contact\.isAI && \(\s*<span className="text-\[9px\] bg-violet-600 text-white px-1\.5 py-0\.5 rounded font-normal">AI<\/span>\s*\)\}\s*<\/h4>/,
  `<h4 className="text-sm font-semibold truncate flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {contact.name}
                        {contact.isAI && (
                          <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded font-normal">AI</span>
                        )}
                      </div>
                      {unreadCounts[contact.id] > 0 && contact.id !== activeContact?.id && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {unreadCounts[contact.id]}
                        </span>
                      )}
                    </h4>`
);

fs.writeFileSync('src/app/dashboard/chat/page.tsx', code);
console.log("Patched chat/page.tsx contacts list");
