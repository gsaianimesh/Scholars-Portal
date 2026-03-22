const fs = require('fs');
let code = fs.readFileSync('src/app/api/user/profile/route.ts', 'utf8');
code = code.replace(/let webhookFailed = false;\s*let manualWebhookUrl = "";/g, '');
code = code.replace('export async function PATCH(request: NextRequest) {', 'export async function PATCH(request: NextRequest) {\n  let webhookFailed = false;\n  let manualWebhookUrl = "";');
code = code.replace('typeof webhookFailed !== "undefined" ? webhookFailed : false', 'webhookFailed');
code = code.replace('typeof manualWebhookUrl !== "undefined" ? manualWebhookUrl : ""', 'manualWebhookUrl');
fs.writeFileSync('src/app/api/user/profile/route.ts', code);
