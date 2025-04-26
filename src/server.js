import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Import crypto module
import { spawn } from 'child_process'; // Import spawn
import path from 'path'; // Needed for module ID sanitization

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
    console.warn('[Webhook] WEBHOOK_SECRET not configured. Skipping verification.');
    // Parse JSON manually if skipping verification, as express.json() might not run
    try {
        req.bodyJson = JSON.parse(req.body.toString('utf-8'));
    } catch (e) {
        console.error('[Webhook] Error parsing JSON payload (no verification).', e);
        return res.status(400).send('Invalid JSON payload.');
    }
    return next();
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) {
    console.error('[Webhook] Error: Missing X-Hub-Signature-256 header.');
    return res.status(400).send('Missing webhook signature.');
  }

  const signature = signatureHeader.split('=')[1];
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
    console.error('[Webhook] Error: Invalid webhook signature.');
    return res.status(403).send('Invalid webhook signature.');
  }

  try {
    req.bodyJson = JSON.parse(req.body.toString('utf-8'));
  } catch (e) {
      console.error('[Webhook] Error parsing JSON payload after signature verification.', e);
      return res.status(400).send('Invalid JSON payload.');
  }

  next();
};

// Middleware to parse JSON bodies (applied AFTER raw middleware for other routes, if any)
// app.use(express.json()); // We don't need this globally anymore if only webhook uses JSON

// --- Helper Function to Sanitize Module ID for Shell ---
// Basic sanitization: remove characters potentially harmful in shell commands
// Adjust this based on expected module ID format and security needs
const sanitizeModuleId = (id) => {
    if (!id || typeof id !== 'string') return '';
    // Allow letters, numbers, dots, hyphens, underscores.
    // Replace anything else with an empty string.
    return id.replace(/[^a-zA-Z0-9._-]/g, '');
};

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
    const parts = file.split('/');
    if (parts.length > 1 && parts[0] === SOURCE_MD_DIR_PREFIX) {
      // Sanitize the extracted module ID before adding
      const sanitizedId = sanitizeModuleId(parts[1]);
      if(sanitizedId) {
        affectedModules.add(sanitizedId);
      }
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

  // --- Respond OK immediately --- 
  res.status(200).send('Webhook received successfully. Processing triggered.');
  console.log(`[Webhook] Responded 200 OK for modules: ${modulesToProcess.join(', ')}.`);

  // --- Asynchronous Processing --- 
  console.log('[Webhook] Starting async processing...');
  modulesToProcess.forEach(moduleId => {
    const safeModuleId = sanitizeModuleId(moduleId);
    if (!safeModuleId) {
        console.error(`[AsyncProc] Invalid module ID detected after sanitization: '${moduleId}'. Skipping.`);
        return;
    }

    console.log(`[AsyncProc] Spawning pipeline for module: ${safeModuleId}`);
    const command = `npm run preprocess -- --module=${safeModuleId} && npm run pipeline -- --module=${safeModuleId}`;
    const shell = process.platform === 'win32' ? 'cmd' : 'sh';
    const args = process.platform === 'win32' ? ['/c', command] : ['-c', command];

    const child = spawn(shell, args, {
        // Change stdio to 'pipe' to capture output
        stdio: ['ignore', 'pipe', 'pipe'] 
    });

    // Log stdout data as it comes in
    child.stdout.on('data', (data) => {
        // Log each line separately to avoid partial lines in Coolify logs
        data.toString().trim().split('\n').forEach(line => {
             if (line) { // Avoid logging empty lines
                console.log(`[AsyncProc ${safeModuleId}]: ${line}`);
             }
        });
    });

    // Log stderr data as it comes in
    child.stderr.on('data', (data) => {
        data.toString().trim().split('\n').forEach(line => {
             if (line) {
                 console.error(`[AsyncProc ${safeModuleId} ERR]: ${line}`);
             }
         });
    });

    child.on('close', (code) => {
        console.log(`[AsyncProc ${safeModuleId}] Process finished with code ${code}.`);
        // No need to log full output here again as it was logged in real-time
        if (code !== 0) {
            console.error(`[AsyncProc ${safeModuleId}] Pipeline failed.`);
        } else {
            console.log(`[AsyncProc ${safeModuleId}] Pipeline completed.`); 
            // The publish script (called by pipeline) should handle its own logging
        }
    });

    child.on('error', (err) => {
        console.error(`[AsyncProc ${safeModuleId}] Failed to spawn process:`, err);
    });
  }); // End of forEach loop
});

// Basic root route for health check or info
app.get('/', (req, res) => {
  res.send('Webhook Listener is running.');
});

// Start the server
app.listen(port, () => {
  console.log(`[Server] Webhook listener started on port ${port}`);
}); 