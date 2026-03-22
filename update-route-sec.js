const fs = require('fs');
let code = fs.readFileSync('src/app/api/webhooks/fathom/route.ts', 'utf8');

const importCrypto = `import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";`;

code = code.replace(`import { NextRequest, NextResponse } from "next/server";`, importCrypto);

const oldVerificationBlock = `    console.log("[Fathom Webhook] Received webhook");

    // Verify webhook signature (optional but recommended)
    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    console.log(\`[Fathom Webhook] ID: \${webhookId}, Timestamp: \${webhookTimestamp}\`);

    const payload: FathomWebhookPayload = await request.json();`;

const newVerificationBlock = `    console.log("[Fathom Webhook] Received webhook");

    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookSignature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    // Get the prof_id from the query string to look up their specific secret
    const url = new URL(request.url);
    const profId = url.searchParams.get("prof_id");
    if (!profId) {
      return NextResponse.json({ error: "Missing prof_id in webhook URL" }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();

    // Look up secret
    const { data: prof } = await serviceClient
      .from("professors")
      .select("fathom_webhook_secret, fathom_api_key")
      .eq("id", profId)
      .maybeSingle();

    if (!prof || !prof.fathom_webhook_secret) {
      return NextResponse.json({ error: "Webhook secret not configured for this professor" }, { status: 401 });
    }

    // Read the raw body as text for signature verification
    const rawBody = await request.text();

    // The signature format is usually "v1,<base64_encoded_hash>"
    const parts = webhookSignature.split(",");
    if (parts.length !== 2 || parts[0] !== "v1") {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
    }

    const incomingSignature = parts[1];
    
    // Hash the raw body with the user's secret
    const expectedSignature = crypto
      .createHmac("sha256", prof.fathom_webhook_secret)
      .update(rawBody)
      .digest("base64");

    // Cryptographic constant-time comparison to prevent timing attacks
    if (incomingSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(incomingSignature), Buffer.from(expectedSignature))) {
      console.error("[Fathom Webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(\`[Fathom Webhook] Signature verified. ID: \${webhookId}, Timestamp: \${webhookTimestamp}\`);

    const payload: FathomWebhookPayload = JSON.parse(rawBody);`;

code = code.replace(oldVerificationBlock, newVerificationBlock);

// Replace mapping action_items to instead map to tasks
const oldActionItemsBlock = `    // Create action items if provided
    if (payload.action_items && payload.action_items.length > 0) {
      const actionItems = payload.action_items.map((item) => ({
        meeting_id: matchedMeeting.id,
        description: item.text,
        assignee_name: item.assignee || "unassigned",
        status: "pending",
      }));

      await serviceClient.from("action_items").insert(actionItems);
    }`;

const newActionItemsBlock = `    // Process tasks using payload directly if include_action_items is active
    if (payload.action_items && (payload.action_items as any[]).length > 0) {
      const { data: profUsr } = await serviceClient.from("professors").select("user_id").eq("id", matchedMeeting.professor_id).single();
      const createdBy = profUsr?.user_id;

      if (createdBy) {
        for (const item of (payload.action_items as any[])) {
          const taskInsert = {
            title: item.text ? item.text.substring(0, 50) + "..." : "Action Item",
            description: item.text || "",
            created_by: createdBy,
            professor_id: matchedMeeting.professor_id,
            status: "not_started",
            meeting_id: matchedMeeting.id,
            is_auto_generated: true
          };
          const { data: task } = await serviceClient.from("tasks").insert(taskInsert).select().single();

          if (task && item.assignee) {
             const assigneeLower = String(item.assignee).toLowerCase();
             // Find scholar
             const { data: scholars } = await serviceClient.from("scholars").select("id, users!inner(name, email)");
             const assigneeMatch = scholars?.find(s => 
                 s.users?.name?.toLowerCase().includes(assigneeLower) ||
                 s.users?.email?.toLowerCase().includes(assigneeLower)
             );

             if (assigneeMatch) {
                await serviceClient.from("task_assignments").insert({
                   task_id: task.id,
                   scholar_id: assigneeMatch.id,
                   status: "not_started"
                });
             }
          }
        }
      }
    }`;

code = code.replace(oldActionItemsBlock, newActionItemsBlock);

// Because I already instantiated serviceClient. Let's make sure I'm not double declaring it.
// The code earlier had `const serviceClient = createServiceRoleClient();`
// I need to remove that original definition since I moved it up.
code = code.replace('    const serviceClient = createServiceRoleClient();\n\n    // Find matching meeting', '    // Find matching meeting');

fs.writeFileSync('src/app/api/webhooks/fathom/route.ts', code);
