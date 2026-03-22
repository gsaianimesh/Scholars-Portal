const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const oldStr = `      if (res.ok) {
        setMessage("Settings saved successfully");
      } else {
        setMessage("Failed to save settings");
      }`;

const newStr = `      if (res.ok) {
        const data = await res.json();
        if (data.webhookFailed && data.manualWebhookUrl) {
          setMessage(\`Key Saved! But auto-configuring webhook failed (Fathom Team plan is required for APIs). To fix: In Fathom settings, go to Webhooks and manually add this URL to sync recordings: \${data.manualWebhookUrl}\`);
        } else {
          setMessage("Settings saved successfully");
        }
      } else {
        setMessage("Failed to save settings");
      }`;

content = content.replace(oldStr, newStr);

fs.writeFileSync('src/app/dashboard/settings/page.tsx', content);
