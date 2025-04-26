import path from 'path';
import fs from 'fs-extra'; // Using fs-extra for easier directory operations
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import simpleGit from 'simple-git'; // Corrected import - use default export
import os from 'os'; // To create temporary directory

// Load environment variables
dotenv.config();

// --- Configuration ---
const SOURCE_MD_ROOT_DIR = process.env.SOURCE_MD_ROOT_DIR || 'source_md';
const CHUNKS_OUTPUT_SUBDIR = 'processed_chunks';

// --- Configuration for Pushing to DOCS Repo ---
const DOCS_REPO_URL = process.env.GIT_REPO_URL; // URL of the DOCS repo (read from existing var)
const TARGET_BRANCH = process.env.GIT_DOCS_WRITE_TARGET_BRANCH || 'main'; // Branch to push results to in DOCS repo
const GIT_DOCS_WRITE_SSH_KEY_PATH = process.env.GIT_DOCS_WRITE_SSH_KEY_PATH; // Path to the SSH private key with WRITE access to DOCS repo
const GIT_DOCS_WRITE_PUSH_TOKEN = process.env.GIT_DOCS_WRITE_PUSH_TOKEN; // Alternative: HTTPS token with WRITE access to DOCS repo
const GIT_COMMIT_USER = process.env.GIT_COMMIT_USER || 'Automated Pipeline';
const GIT_COMMIT_EMAIL = process.env.GIT_COMMIT_EMAIL || 'pipeline@example.com';

// Helper to get __dirname like functionality in ESM
// Resolve the path of the currently executing script
let currentFilePath = '';
try {
    // For ES modules, import.meta.url is standard
    currentFilePath = path.dirname(new URL(import.meta.url).pathname);
    // Handle potential leading slash on Windows paths from URL parsing
    if (process.platform === 'win32' && currentFilePath.startsWith('/')) {
        currentFilePath = currentFilePath.substring(1);
    }
} catch (e) {
    // Fallback for environments where import.meta.url might not be available (less likely for Node.js script)
    currentFilePath = __dirname;
}
const __dirname_esm = currentFilePath;


// --- Argument Parsing ---
const argv = yargs(hideBin(process.argv))
  .option('module', {
    alias: 'm',
    description: 'The ID of the module whose results should be published back to the docs repo',
    type: 'string',
    demandOption: true,
  })
  .help()
  .alias('help', 'h')
  .parse();

const moduleId = argv.module;

// --- Main Publishing Logic ---
async function publishResultsToDocsRepo(targetModuleId) {
  console.log(`[PublishDocs] Starting publishing results for module: ${targetModuleId} back to Docs Repo`);

  if (!DOCS_REPO_URL) {
      console.error('[PublishDocs] Error: GIT_REPO_URL environment variable is not set. Cannot publish results.');
      process.exit(1);
  }

  // Check if authentication is already embedded in the URL
  let isAuthEmbeddedInUrl = false;
  try {
      const url = new URL(DOCS_REPO_URL);
      if (url.password || url.username) { // Check for username/password in URL
          // Check specifically for common token patterns if desired, but presence is enough for now
          if (DOCS_REPO_URL.includes('@')) {
             console.log('[PublishDocs] Detected authentication info embedded in GIT_REPO_URL.');
             isAuthEmbeddedInUrl = true;
          }
      }
  } catch (e) {
       console.warn('[PublishDocs] Could not parse GIT_REPO_URL to check for embedded auth. Assuming separate auth is needed.');
  }

  // Check for explicit auth methods ONLY if auth is not embedded in URL
  if (!isAuthEmbeddedInUrl && !GIT_DOCS_WRITE_SSH_KEY_PATH && !GIT_DOCS_WRITE_PUSH_TOKEN) {
      console.error('[PublishDocs] Error: No authentication method provided (GIT_DOCS_WRITE_SSH_KEY_PATH or GIT_DOCS_WRITE_PUSH_TOKEN required, or embed auth in GIT_REPO_URL).');
      process.exit(1);
  }

  const localSourceChunksDir = path.resolve(process.cwd(), SOURCE_MD_ROOT_DIR, targetModuleId, CHUNKS_OUTPUT_SUBDIR);
  let tempRepoPath = '';

  try {
      tempRepoPath = await fs.mkdtemp(path.join(os.tmpdir(), `publish-docs-${targetModuleId}-`));
      const targetChunksDirInRepo = path.resolve(tempRepoPath, targetModuleId, CHUNKS_OUTPUT_SUBDIR);

      console.log(`[PublishDocs] Local source chunks directory: ${localSourceChunksDir}`);
      console.log(`[PublishDocs] Temporary clone directory: ${tempRepoPath}`);
      console.log(`[PublishDocs] Target directory in clone: ${targetChunksDirInRepo}`);

      let gitOptions = {
          baseDir: tempRepoPath,
          binary: 'git',
          maxConcurrentProcesses: 6,
          config: []
      };

      let gitRepoUrl = DOCS_REPO_URL;
      let gitEnv = { ...process.env };

      // --- Configure Git Authentication ONLY IF NOT EMBEDDED IN URL --- 
      if (!isAuthEmbeddedInUrl) {
            if (GIT_DOCS_WRITE_SSH_KEY_PATH) {
                console.log(`[PublishDocs] Configuring Git SSH key authentication (WRITE) using path: ${GIT_DOCS_WRITE_SSH_KEY_PATH}`);
                try {
                    await fs.access(GIT_DOCS_WRITE_SSH_KEY_PATH);
                    gitEnv.GIT_SSH_COMMAND = `ssh -i \"${GIT_DOCS_WRITE_SSH_KEY_PATH}\" -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;
                    console.log(`[PublishDocs] GIT_SSH_COMMAND set for SSH operations.`);
                    gitOptions.config.push('core.sshCommand=ssh');
                } catch (keyError) {
                    console.error(`[PublishDocs] Error accessing SSH key (WRITE) at ${GIT_DOCS_WRITE_SSH_KEY_PATH}: ${keyError.message}.`);
                    throw keyError; // Propagate error
                }
            } else if (GIT_DOCS_WRITE_PUSH_TOKEN) {
                console.log("[PublishDocs] Configuring Git HTTPS token authentication (WRITE).");
                try {
                    const url = new URL(gitRepoUrl); // Use original URL here
                    url.password = GIT_DOCS_WRITE_PUSH_TOKEN;
                    url.username = 'token'; // Adjust if necessary for provider
                    gitRepoUrl = url.toString(); // Modify the URL ONLY if using separate token
                    console.log("[PublishDocs] Using URL modified with explicit token for HTTPS operations.");
                } catch (urlError) {
                    console.error(`[PublishDocs] Error parsing GIT_REPO_URL for explicit token injection: ${urlError.message}.`);
                    throw urlError; // Propagate error
                }
            }
      }
      // --- End Auth Configuration ---

      gitOptions.env = gitEnv;
      const git = simpleGit(gitOptions);

      // 1. Clone the Docs Repository (using potentially modified gitRepoUrl)
      console.log(`[PublishDocs] Cloning ${gitRepoUrl} (branch: ${TARGET_BRANCH}) into ${tempRepoPath}...`);
      try {
          await git.clone(gitRepoUrl, '.', [
              `--branch=${TARGET_BRANCH}`,
              '--single-branch',
              '--depth=1'
          ]);
          console.log(`[PublishDocs] Successfully cloned docs repository.`);
      } catch (cloneError) {
          console.error(`[PublishDocs] Error cloning docs repository/branch: ${cloneError.message}. Check URL, branch, and auth.`);
          throw cloneError;
      }
      
      // 2. Configure Git User for Commit
      console.log(`[PublishDocs] Configuring git user ${GIT_COMMIT_USER} <${GIT_COMMIT_EMAIL}>...`);
      await git.addConfig('user.name', GIT_COMMIT_USER, false, 'local');
      await git.addConfig('user.email', GIT_COMMIT_EMAIL, false, 'local');

      // 3. Prepare Target Directory in Clone
      console.log(`[PublishDocs] Ensuring target directory exists and clearing old chunks for module ${targetModuleId} in ${targetChunksDirInRepo}...`);
      await fs.ensureDir(targetChunksDirInRepo);
      await fs.emptyDir(targetChunksDirInRepo);

      // 4. Copy New Chunk Files from Local Storage to Clone
      console.log(`[PublishDocs] Copying processed chunks from ${localSourceChunksDir} to ${targetChunksDirInRepo}...`);
      let copiedFiles = false;
      try {
          await fs.access(localSourceChunksDir);
          await fs.copy(localSourceChunksDir, targetChunksDirInRepo);
          console.log(`[PublishDocs] Successfully copied chunk files.`);
          copiedFiles = true;
      } catch (copyError) {
          if (copyError.code === 'ENOENT') {
              console.warn(`[PublishDocs] Local source chunk directory ${localSourceChunksDir} not found. Nothing to publish.`);
          } else {
              throw copyError;
          }
      }

      // 5. Check for Changes
      console.log(`[PublishDocs] Checking for changes...`);
      const status = await git.status();

      if (status.files.length === 0 && !copiedFiles) {
          console.log(`[PublishDocs] No new files copied and no other changes detected. Nothing to commit or push.`);
      } else {
          console.log(`[PublishDocs] Changes detected. Proceeding with commit.`);
          // 6. Add, Commit, Push
          console.log(`[PublishDocs] Adding changes...`);
          await git.add(`${targetModuleId}/${CHUNKS_OUTPUT_SUBDIR}`);
          const stagedStatus = await git.status();
          if (stagedStatus.staged.length === 0) {
              console.log(`[PublishDocs] No changes were staged. Skipping commit and push.`);
          } else {
              console.log(`[PublishDocs] Staged files: ${stagedStatus.staged.join(', ')}`);
              console.log(`[PublishDocs] Committing changes...`);
              const commitMessage = `Update processed chunks for module ${targetModuleId}`;
              await git.commit(commitMessage);
              console.log(`[PublishDocs] Pushing changes to origin/${TARGET_BRANCH}...`);
              await git.push('origin', TARGET_BRANCH);
              console.log(`[PublishDocs] Successfully pushed results for module ${targetModuleId} to docs repo.`);
          }
      }

  } catch (error) {
      console.error(`[PublishDocs] Error during publishing operation for module ${targetModuleId}:`, error);
  } finally {
      // 7. Clean up temporary directory
      if (tempRepoPath) {
          console.log(`[PublishDocs] Cleaning up temporary directory ${tempRepoPath}...`);
          await fs.remove(tempRepoPath).catch(err => console.error(`Failed to remove temp directory ${tempRepoPath}: ${err}`));
      }
      console.log(`[PublishDocs] Finished publishing attempt for module: ${targetModuleId}`);
  }
}

// --- Run the script ---
publishResultsToDocsRepo(moduleId); 