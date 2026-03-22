const fs = require('fs');
let content = fs.readFileSync('src/app/onboarding/page.tsx', 'utf8');

// Return explicitly
if (!content.includes('React.ReactElement')) {
  content = content.replace("export default function OnboardingPage() {", "import React from 'react';\n\nexport default function OnboardingPage(): React.ReactElement | null {");
}

fs.writeFileSync('src/app/onboarding/page.tsx', content);
