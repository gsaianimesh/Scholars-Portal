const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/{app,components}/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add import if we need to replace loading
  const loadingMatcher1 = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<[^\>]+>\s*(?:<[^\>]+>)*(?:Loading\.\.\.|Loading\s+[A-Za-z]+(?:\.\.\.)?|Loading dashboard\.\.\.)(?:<\/[^\>]+>)*\s*<\/[^\>]+>\s*\);\s*\}/s;
  
  const loadingMatcher2 = /if\s*\(\s*loading\s*\)\s*return\s*<div[^>]*>Loading\.\.\.<\/div>;/g;

  let hasReplaced = false;

  if (loadingMatcher1.test(content)) {
    content = content.replace(loadingMatcher1, "if (loading) {\n    return <LoadingState layout=\"dashboard\" />;\n  }");
    hasReplaced = true;
  }

  if (loadingMatcher2.test(content)) {
    content = content.replace(loadingMatcher2, "if (loading) return <LoadingState layout=\"dashboard\" />;");
    hasReplaced = true;
  }

  // Also replace inline `{loading ? ... :`
  const inlineLoadingMatcher = /\{\s*loading\s*\?\s*\(\s*<div[^>]*>Loading\.\.\.<\/div>\s*\)\s*:\s*\(/g;
  if (inlineLoadingMatcher.test(content)) {
    content = content.replace(inlineLoadingMatcher, "{loading ? (\n        <LoadingState layout=\"dashboard\" />\n      ) : (");
    hasReplaced = true;
  }

  if (hasReplaced && !content.includes('LoadingState')) {
     if (content.includes('from "lucide-react"')) {
         content = content.replace(/from "lucide-react";?\n/, 'from "lucide-react";\nimport { LoadingState } from "@/components/loading-screen";\n');
     } else if (content.includes('from "@/components/ui/button"')) {
         content = content.replace(/from "@\/components\/ui\/button";?\n/, 'from "@/components/ui/button";\nimport { LoadingState } from "@/components/loading-screen";\n');
     } else {
         content = 'import { LoadingState } from "@/components/loading-screen";\n' + content;
     }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated loaders in:', file);
  }
});
