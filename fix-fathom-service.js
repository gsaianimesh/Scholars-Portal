const fs = require('fs');
let code = fs.readFileSync('src/lib/services/fathom.ts', 'utf8');

code = code.replace(
  'export async function registerFathomWebhook(\\n  webhookUrl: string,\\n  apiKey: string\\n): Promise<{ id: string; url: string }> {',
  'export async function registerFathomWebhook(\\n  webhookUrl: string,\\n  apiKey: string\\n): Promise<{ id: string; url: string; secret?: string }> {'
);

code = code.replace(
  'return { id: existing.id, url: existing.url || existing.destination_url };',
  'return { id: existing.id, url: existing.url || existing.destination_url, secret: existing.secret };'
);

code = code.replace(
  'return { id: data.id, url: data.url || data.destination_url };',
  'return { id: data.id, url: data.url || data.destination_url, secret: data.secret };'
);

code = code.replace(
  'include_action_items: false,',
  'include_action_items: true,'
);

code = code.replace(
  '"my_shared_with_team_recordings",\\n        "shared_external_recordings"',
  ''
);

fs.writeFileSync('src/lib/services/fathom.ts', code);
