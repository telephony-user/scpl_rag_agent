import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Import crypto module

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.WEBHOOK_LISTENER_PORT || 3000; // Use port from env or default to 3000
const webhookSecret = process.env.WEBHOOK_SECRET;
const SOURCE_MD_DIR_PREFIX = process.env.SOURCE_MD_ROOT_DIR || 'source_md'; // Get prefix from env or use default

// --- Webhook Validation Middleware ---
// IMPORTANT: Use express.raw middleware BEFORE express.json for signature verification
// because the signature is calculated based on the raw request body.
app.use(express.raw({ type: 'application/json' }));

const verifyWebhookSignature = (req, res, next) => {
  if (!webhookSecret) {
    console.warn('[Webhook] WEBHOOK_SECRET not configured. Skipping signature verification. THIS IS INSECURE!');
    return next(); // Proceed without verification if secret is not set (unsafe)
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) {
    console.error('[Webhook] Error: Missing X-Hub-Signature-256 header.');
    return res.status(400).send('Missing webhook signature.');
  }

  const signature = signatureHeader.split('=')[1];
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body) // Use the raw body buffer
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
    console.error('[Webhook] Error: Invalid webhook signature.');
    return res.status(403).send('Invalid webhook signature.');
  }

  // Signature is valid, parse the JSON body from the raw buffer and attach it to req.bodyJson
  // We need to do this manually because express.raw captured the body stream.
  try {
    req.bodyJson = JSON.parse(req.body.toString('utf-8'));
  } catch (e) {
      console.error('[Webhook] Error parsing JSON payload after signature verification.', e);
      return res.status(400).send('Invalid JSON payload.');
  }

  next(); // Proceed to the main handler
};

// Middleware to parse JSON bodies (applied AFTER raw middleware for other routes, if any)
// app.use(express.json()); // We don't need this globally anymore if only webhook uses JSON

// Webhook endpoint - Apply validation middleware first
app.post('/webhook/docs-push', verifyWebhookSignature, (req, res) => {
  console.log('[Webhook] Received and validated push event');
  const payload = req.bodyJson;

  // --- Payload Parsing Logic ---
  const changedFiles = [];
  if (payload && payload.commits && Array.isArray(payload.commits)) {
    payload.commits.forEach(commit => {
      if (commit.added && Array.isArray(commit.added)) {
        changedFiles.push(...commit.added);
      }
      if (commit.modified && Array.isArray(commit.modified)) {
        changedFiles.push(...commit.modified);
      }
      // We might also consider commit.removed if deleted files should trigger cleanup
    });
  }

  const relevantFiles = changedFiles.filter(file =>
    file.startsWith(`${SOURCE_MD_DIR_PREFIX}/`) && (file.endsWith('.md') || file.endsWith('.docx'))
  );

  const affectedModules = new Set();
  relevantFiles.forEach(file => {
    // Extract module_id assuming structure source_md/<module_id>/.../...file.ext
    const parts = file.split('/');
    if (parts.length > 1 && parts[0] === SOURCE_MD_DIR_PREFIX) {
      affectedModules.add(parts[1]); // The part after source_md/
    }
  });

  if (affectedModules.size === 0) {
    console.log('[Webhook] No relevant file changes detected in this push.');
    return res.status(200).send('Webhook received, no relevant changes.');
  }

  console.log(`[Webhook] Detected changes affecting modules: ${[...affectedModules].join(', ')}`);

  // --- End Payload Parsing ---

  // TODO (Phase 3.3): Asynchronously trigger pipeline for each module in affectedModules
  const modulesToProcess = [...affectedModules];
  // Placeholder: Just log the modules that need processing
  console.log(`[Webhook] Modules queued for async processing: ${modulesToProcess.join(', ')}`);

  // Respond immediately to GitHub/GitLab to avoid timeouts
  res.status(200).send('Webhook received successfully. Processing triggered.');

  // Actual processing will happen asynchronously after this response
  console.log(`[Webhook] Responded 200 OK for modules: ${modulesToProcess.join(', ')}. Async processing should start now (if implemented).`);
});

// Basic root route for health check or info
app.get('/', (req, res) => {
  res.send('Webhook Listener is running.');
});

// Start the server
app.listen(port, () => {
  console.log(`[Server] Webhook listener started on port ${port}`);
}); 