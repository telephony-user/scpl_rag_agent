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
  console.log(`[PublishDocs ${targetModuleId}] Starting publishing results back to Docs Repo`);
  let tempRepoPath = ''; // Define path outside try block for finally

  try {
      // --- Authentication Checks (remain the same) ---
       if (!DOCS_REPO_URL) {
          console.error(`[PublishDocs ${targetModuleId}] Error: GIT_REPO_URL environment variable is not set. Cannot publish results.`);
          process.exit(1);
       }
       let isAuthEmbeddedInUrl = false;
       try {
           const url = new URL(DOCS_REPO_URL);
           if (url.password || url.username) {
               if (DOCS_REPO_URL.includes('@')) {
                  console.log(`[PublishDocs ${targetModuleId}] Detected authentication info embedded in GIT_REPO_URL.`);
                  isAuthEmbeddedInUrl = true;
               }
           }
       } catch (e) {
            console.warn(`[PublishDocs ${targetModuleId}] Could not parse GIT_REPO_URL to check for embedded auth. Assuming separate auth is needed.`);
       }
       if (!isAuthEmbeddedInUrl && !GIT_DOCS_WRITE_SSH_KEY_PATH && !GIT_DOCS_WRITE_PUSH_TOKEN) {
           console.error(`[PublishDocs ${targetModuleId}] Error: No authentication method provided (GIT_DOCS_WRITE_SSH_KEY_PATH or GIT_DOCS_WRITE_PUSH_TOKEN required, or embed auth in GIT_REPO_URL).`);
           process.exit(1);
       }
      // --- End Authentication Checks ---

      const localSourceChunksDir = path.resolve(process.cwd(), SOURCE_MD_ROOT_DIR, targetModuleId, CHUNKS_OUTPUT_SUBDIR);
      console.log(`[PublishDocs ${targetModuleId}] Local source chunks directory: ${localSourceChunksDir}`);

      // Create temporary directory
      tempRepoPath = await fs.mkdtemp(path.join(os.tmpdir(), `publish-docs-${targetModuleId}-`));
      console.log(`[PublishDocs ${targetModuleId}] Created temporary clone directory: ${tempRepoPath}`);
      
      const targetChunksDirInRepo = path.resolve(tempRepoPath, targetModuleId, CHUNKS_OUTPUT_SUBDIR);
      console.log(`[PublishDocs ${targetModuleId}] Target directory in clone: ${targetChunksDirInRepo}`);

      // --- Git Setup (remain the same) ---
      let gitOptions = {
          baseDir: tempRepoPath,
          binary: 'git',
          maxConcurrentProcesses: 6,
          config: []
      };
      let gitRepoUrl = DOCS_REPO_URL;
      let gitEnv = { ...process.env };
      if (!isAuthEmbeddedInUrl) {
            if (GIT_DOCS_WRITE_SSH_KEY_PATH) {
                 console.log(`[PublishDocs ${targetModuleId}] Configuring Git SSH key authentication (WRITE) using path: ${GIT_DOCS_WRITE_SSH_KEY_PATH}`);
                 try {
                    await fs.access(GIT_DOCS_WRITE_SSH_KEY_PATH);
                    gitEnv.GIT_SSH_COMMAND = `ssh -i "${GIT_DOCS_WRITE_SSH_KEY_PATH}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;
                    console.log(`[PublishDocs ${targetModuleId}] GIT_SSH_COMMAND set for SSH operations.`);
                    gitOptions.config.push('core.sshCommand=ssh');
                } catch (keyError) {
                    console.error(`[PublishDocs ${targetModuleId}] Error accessing SSH key (WRITE) at ${GIT_DOCS_WRITE_SSH_KEY_PATH}: ${keyError.message}.`);
                    throw keyError; 
                }
            } else if (GIT_DOCS_WRITE_PUSH_TOKEN) {
                 console.log(`[PublishDocs ${targetModuleId}] Configuring Git HTTPS token authentication (WRITE).`);
                try {
                    const url = new URL(gitRepoUrl);
                    url.password = GIT_DOCS_WRITE_PUSH_TOKEN;
                    url.username = 'token'; 
                    gitRepoUrl = url.toString(); 
                    console.log(`[PublishDocs ${targetModuleId}] Using URL modified with explicit token for HTTPS operations.`);
                } catch (urlError) {
                    console.error(`[PublishDocs ${targetModuleId}] Error parsing GIT_REPO_URL for explicit token injection: ${urlError.message}.`);
                    throw urlError; 
                }
            }
      }
      gitOptions.env = gitEnv;
      // --- End Git Setup ---
      
      const git = simpleGit(gitOptions);

      // 1. Clone the Docs Repository
      console.log(`[PublishDocs ${targetModuleId}] Attempting to clone ${gitRepoUrl} (branch: ${TARGET_BRANCH}) into ${tempRepoPath}...`);
      try {
          await git.clone(gitRepoUrl, '.', [
              `--branch=${TARGET_BRANCH}`,
              '--single-branch',
              '--depth=1'
          ]);
          console.log(`[PublishDocs ${targetModuleId}] Successfully cloned docs repository.`);
      } catch (cloneError) {
          console.error(`[PublishDocs ${targetModuleId}] Error during git clone operation: ${cloneError.message}. Check URL, branch, and auth. Also check temporary directory state.`);
          // Adding stack trace for more details
          console.error(cloneError.stack); 
          throw cloneError;
      }
      
      // 2. Configure Git User
      console.log(`[PublishDocs ${targetModuleId}] Attempting to configure git user ${GIT_COMMIT_USER} <${GIT_COMMIT_EMAIL}>...`);
      await git.addConfig('user.name', GIT_COMMIT_USER, false, 'local');
      await git.addConfig('user.email', GIT_COMMIT_EMAIL, false, 'local');
      console.log(`[PublishDocs ${targetModuleId}] Successfully configured git user.`);

      // 3. Prepare Target Directory in Clone
      console.log(`[PublishDocs ${targetModuleId}] Attempting to ensure target directory exists and clear old chunks in ${targetChunksDirInRepo}...`);
      await fs.ensureDir(targetChunksDirInRepo);
      await fs.emptyDir(targetChunksDirInRepo);
      console.log(`[PublishDocs ${targetModuleId}] Successfully prepared target directory.`);

      // 4. Copy New Chunk Files
      console.log(`[PublishDocs ${targetModuleId}] Attempting to copy processed chunks from ${localSourceChunksDir} to ${targetChunksDirInRepo}...`);
      let copiedFiles = false;
      try {
          await fs.access(localSourceChunksDir);
          await fs.copy(localSourceChunksDir, targetChunksDirInRepo);
          console.log(`[PublishDocs ${targetModuleId}] Successfully copied chunk files.`);
          copiedFiles = true;
      } catch (copyError) {
          if (copyError.code === 'ENOENT') {
              console.warn(`[PublishDocs ${targetModuleId}] Local source chunk directory ${localSourceChunksDir} not found. Nothing to publish.`);
          } else {
              console.error(`[PublishDocs ${targetModuleId}] Error copying chunks: ${copyError.message}`);
              throw copyError;
          }
      }

      // 5. Check for Changes
      console.log(`[PublishDocs ${targetModuleId}] Attempting to check git status...`);
      const status = await git.status();
      console.log(`[PublishDocs ${targetModuleId}] Git status checked. Files changed: ${status.files.length}. Copied new files: ${copiedFiles}`);

      if (status.files.length === 0 && !copiedFiles) {
          console.log(`[PublishDocs ${targetModuleId}] No changes detected. Nothing to commit or push.`);
      } else {
          console.log(`[PublishDocs ${targetModuleId}] Changes detected. Proceeding with commit and push.`);
          // 6. Add, Commit, Push
          const filesToAdd = `${targetModuleId}/${CHUNKS_OUTPUT_SUBDIR}`;
          console.log(`[PublishDocs ${targetModuleId}] Attempting to git add '${filesToAdd}'...`);
          await git.add(filesToAdd);
          console.log(`[PublishDocs ${targetModuleId}] Successfully added files.`);
          
          console.log(`[PublishDocs ${targetModuleId}] Checking staged status...`);
          const stagedStatus = await git.status(); // Check status again after add
          if (stagedStatus.staged.length === 0) {
              console.log(`[PublishDocs ${targetModuleId}] No changes were actually staged. Skipping commit and push.`);
          } else {
              console.log(`[PublishDocs ${targetModuleId}] Staged files: ${stagedStatus.staged.join(', ')}`);
              const commitMessage = `Update processed chunks for module ${targetModuleId}`;
              console.log(`[PublishDocs ${targetModuleId}] Attempting to commit with message: "${commitMessage}"...`);
              await git.commit(commitMessage);
              console.log(`[PublishDocs ${targetModuleId}] Successfully committed.`);
              
              console.log(`[PublishDocs ${targetModuleId}] Attempting to push to origin/${TARGET_BRANCH}...`);
              await git.push('origin', TARGET_BRANCH);
              console.log(`[PublishDocs ${targetModuleId}] Successfully pushed results for module ${targetModuleId} to docs repo.`);
          }
      }

  } catch (error) {
      // Log the specific error that broke the chain
      console.error(`[PublishDocs ${targetModuleId}] CRITICAL ERROR during publishing operation:`, error.message);
      // Also log stack trace for the critical error
      console.error(error.stack); 
      // Optionally exit with non-zero code to signal failure more strongly
      // process.exit(1); 
  } finally {
      // 7. Ensure temporary directory is removed
      if (tempRepoPath) {
          console.log(`[PublishDocs ${targetModuleId}] Cleaning up temporary directory ${tempRepoPath}...`);
          try {
              await fs.remove(tempRepoPath);
              console.log(`[PublishDocs ${targetModuleId}] Successfully removed temporary directory.`);
          } catch (removeError) {
              console.error(`[PublishDocs ${targetModuleId}] FAILED to remove temporary directory ${tempRepoPath}: ${removeError.message}`);
          }
      }
      console.log(`[PublishDocs ${targetModuleId}] Finished publishing attempt.`);
  }
}

// --- Run the script ---
console.log(`[PublishScript] Script invoked for module: ${moduleId}`);
publishResultsToDocsRepo(moduleId); 