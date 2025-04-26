import path from 'path';
import fs from 'fs-extra';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import simpleGit from 'simple-git';
import { glob } from 'glob';
import os from 'os'; // Needed for temporary directory
import { spawn } from 'child_process'; // For Pandoc
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString as hastToString } from 'hast-util-to-string'; // For getting text from header nodes
import remarkStringify from 'remark-stringify'; // To stringify chunks
import { Buffer } from 'buffer'; // For base64 image data

// Assuming llm_processor.js is in the same directory or adjust path
// import { getMermaidDiagramFromImage } from './llm_processor.js';

// Load environment variables
dotenv.config();

// --- Configuration ---
const SOURCE_MD_ROOT_DIR_PERSISTENT = process.env.SOURCE_MD_ROOT_DIR || 'source_md'; // Persistent storage dir
const CHUNKS_OUTPUT_SUBDIR = 'processed_chunks';
const CONVERTED_MD_SUBDIR = 'converted_md'; // Subdirectory for converted MD files
const DOCS_REPO_URL = process.env.GIT_REPO_URL; // URL of the DOCS repo (same as publish script uses)
const DOCS_REPO_BRANCH = process.env.GIT_DOCS_READ_TARGET_BRANCH || 'main'; // Branch to clone/pull from

// --- Splitter Configuration ---
const MIN_CHUNK_LENGTH = parseInt(process.env.MIN_CHUNK_LENGTH || '2000', 10);
const MAX_CHUNK_LENGTH = parseInt(process.env.MAX_CHUNK_LENGTH || '5000', 10);
const SPLIT_HEADERS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

// --- Image Processing Config ---
const SKIP_SVG = process.env.SKIP_SVG !== 'false'; // Skip SVG by default
const LLM_IMAGE_ENDPOINT = process.env.LLM_IMAGE_ENDPOINT; // Endpoint for image->Mermaid LLM
const LLM_API_KEY = process.env.LLM_API_KEY; // API key for the LLM

// --- Argument Parsing ---
const argv = yargs(hideBin(process.argv))
  .option('module', {
    alias: 'm',
    description: 'The ID of the module to preprocess',
    type: 'string',
    demandOption: true,
  })
  .help()
  .alias('help', 'h')
  .parse();

const moduleId = argv.module;

// --- Helper: Sanitize Filename ---
function sanitizeFilename(filename) {
  // Remove path, keep extension, replace invalid chars
  let baseName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  // Add a prefix to avoid potential collisions or starting with invalid chars
  return `_______${baseName}`;
}

// --- Helper: Git Fetcher (Now operates on a given directory) ---
async function ensureRepoUpdated(repoUrl, branch, targetDir) {
  console.log(`[Git Fetcher] Ensuring repository is up-to-date in: ${targetDir}`);
  const git = simpleGit({ baseDir: targetDir, binary: 'git', maxConcurrentProcesses: 6 });

  try {
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      console.log(`[Git Fetcher] Local directory exists. Fetching and resetting...`);
      try {
          await git.fetch('origin', branch);
          // Force reset to the fetched branch state
          await git.reset(['--hard', `origin/${branch}`]); 
          // Clean untracked files and directories forcefully
          await git.clean(simpleGit.CleanOptions.FORCE + simpleGit.CleanOptions.RECURSIVE + simpleGit.CleanOptions.IGNORED_TOO); 
          console.log(`[Git Fetcher] Successfully reset to origin/${branch} and cleaned directory.`);
      } catch (pullError) {
          console.error(`[Git Fetcher] Error during git fetch/reset/clean:`, pullError);
          console.error('[Git Fetcher] Возможно, требуется ручное разрешение конфликтов или проверка прав доступа.');
          throw pullError; // Re-throw to stop processing
      }
    } else {
      console.log(`[Git Fetcher] Local directory is not a repo or doesn't exist. Cloning...`);
      try {
        await simpleGit().clone(repoUrl, targetDir, [`--branch=${branch}`, '--depth=1']);
        console.log(`[Git Fetcher] Repository successfully cloned into ${targetDir}.`);
      } catch (cloneError) {
        console.error(`[Git Fetcher] Error cloning repository:`, cloneError);
        throw cloneError; // Re-throw to stop processing
      }
    }
  } catch (error) {
      console.error(`[Git Fetcher] Failed to ensure repository state in ${targetDir}:`, error);
      throw error;
  }
}

// --- Helper: Pandoc Converter ---
async function convertDocxToMd(docxPath, outputDir, moduleDir) {
  const safeBaseName = sanitizeFilename(path.basename(docxPath, '.docx'));
  const outputMdFilename = `${safeBaseName}.md`;
  const outputMdPath = path.join(outputDir, outputMdFilename);
  // Media dir relative to the output MD file
  const mediaSubDir = `./${safeBaseName}_media`; 
  const absoluteMediaDir = path.join(outputDir, `${safeBaseName}_media`); // Absolute path for fs operations if needed

  console.log(`[Pandoc] Converting: ${path.basename(docxPath)} -> ${outputMdFilename}`);
  console.log(`[Pandoc] Output MD: ${outputMdPath}`);
  console.log(`[Pandoc] Media Dir: ${mediaSubDir} (in ${outputDir})`);

  // Ensure output directory exists
  await fs.ensureDir(outputDir);

  const pandocArgs = [
      '-f', 'docx',            // Input format
      '-t', 'gfm',             // Output format (GitHub Flavored Markdown)
      '--extract-media', mediaSubDir, // Extract media to specified dir
      '--wrap=none',          // Don't wrap lines
      '-o', outputMdPath,       // Output file path
      docxPath               // Input file path
  ];

  console.log(`[Pandoc] Executing: pandoc ${pandocArgs.join(' ')}`);

  return new Promise((resolve, reject) => {
      const pandoc = spawn('pandoc', pandocArgs, {
          // Set cwd so relative media path works correctly
          cwd: outputDir 
      });
      let stderr = '';
      pandoc.stderr.on('data', (data) => { stderr += data; });
      pandoc.on('close', (code) => {
          if (code === 0) {
              console.log(`[Pandoc] Successfully converted ${path.basename(docxPath)} to ${outputMdPath}`);
              resolve({ mdPath: outputMdPath, mediaDir: absoluteMediaDir });
          } else {
              console.error(`[Pandoc] Error converting ${path.basename(docxPath)} (code ${code}): ${stderr}`);
              reject(new Error(`Pandoc failed with code ${code}`));
          }
      });
      pandoc.on('error', (err) => {
          console.error(`[Pandoc] Failed to start Pandoc for ${path.basename(docxPath)}: ${err}`);
          reject(err);
      });
  });
}

// --- Main Preprocessing Logic ---
async function preprocessModule(targetModuleId) {
  console.log(`[Preprocess] Starting preprocessing for module: ${targetModuleId}`);
  let tempWorkingDir = ''; // Path for the temporary clone
  const finalChunksOutputDir = path.resolve(process.cwd(), SOURCE_MD_ROOT_DIR_PERSISTENT, targetModuleId, CHUNKS_OUTPUT_SUBDIR);

  try {
    // 1. Create Temporary Directory
    tempWorkingDir = await fs.mkdtemp(path.join(os.tmpdir(), `preprocess-${targetModuleId}-`));
    console.log(`[Preprocess] Created temporary working directory: ${tempWorkingDir}`);

    // 2. Ensure Repo is Updated in Temporary Directory
    if (!DOCS_REPO_URL) {
        throw new Error('GIT_REPO_URL environment variable is not set.');
    }
    await ensureRepoUpdated(DOCS_REPO_URL, DOCS_REPO_BRANCH, tempWorkingDir);
    console.log(`[Preprocess] Documentation repository check/update complete in temp dir.`);

    // 3. Define Source Directory WITHIN the Temporary Directory
    const tempSourceModuleDir = path.join(tempWorkingDir, targetModuleId);
    console.log(`[Preprocess] Source directory for this run: ${tempSourceModuleDir}`);
    if (!await fs.pathExists(tempSourceModuleDir)) {
        console.error(`[Preprocess] Error: Module directory not found within the cloned repository: ${tempSourceModuleDir}`);
        // Attempt to list contents of tempWorkingDir for debugging
        try {
            const rootContents = await fs.readdir(tempWorkingDir);
            console.log(`[Preprocess Debug] Contents of temporary root (${tempWorkingDir}):`, rootContents.join(', '));
        } catch (listError) {
            console.error(`[Preprocess Debug] Could not list contents of ${tempWorkingDir}.`);
        }
        throw new Error(`Module directory ${targetModuleId} not found in repository root.`);
    }

    // 4. Convert DOCX to MD (within temp directory)
    const tempConvertedMdDir = path.join(tempSourceModuleDir, CONVERTED_MD_SUBDIR);
    await fs.ensureDir(tempConvertedMdDir); // Ensure converted_md dir exists
    console.log(`[Preprocess] Searching for .docx files in ${tempSourceModuleDir}...`);
    const docxFiles = await glob('*.docx', { cwd: tempSourceModuleDir, absolute: true });
    console.log(`[Preprocess] Found ${docxFiles.length} .docx files.`);
    let convertedCount = 0;
    for (const docxFile of docxFiles) {
        try {
            await convertDocxToMd(docxFile, tempConvertedMdDir, tempSourceModuleDir);
            console.log(`[Preprocess] Converted ${path.basename(docxFile)} to ${tempConvertedMdDir}`);
            convertedCount++;
        } catch (conversionError) {
            console.error(`[Preprocess] Failed to convert ${docxFile}. Skipping.`);
        }
    }
    console.log(`[Preprocess] Successfully converted ${convertedCount} .docx files.`);

    // 5. Process MD files (Original and Converted) for image replacement and splitting
    console.log(`[Preprocess] Searching for all .md files (original and converted) in ${tempSourceModuleDir}...`);
    // Search in root of module dir and in converted_md subdir
    const mdFiles = await glob([`*.md`, `${CONVERTED_MD_SUBDIR}/*.md`], { cwd: tempSourceModuleDir, absolute: true });
    // Make unique in case an original MD has the same name as a converted one (unlikely)
    const uniqueMdFiles = [...new Set(mdFiles)];
    console.log(`[Preprocess] Found ${uniqueMdFiles.length} unique .md files to process.`);

    let totalChunksGenerated = 0;
    // Ensure the FINAL chunks output directory exists in the persistent storage
    await fs.ensureDir(finalChunksOutputDir);
    await fs.emptyDir(finalChunksOutputDir); // Clear old chunks before saving new ones

    for (const mdFilePath of uniqueMdFiles) {
        const relativeMdPath = path.relative(tempSourceModuleDir, mdFilePath);
        console.log(`[Preprocess] Processing MD file: ${relativeMdPath}`);
        
        // --- Image Processing & Splitting Logic (Operates on mdFilePath within temp dir) --- 
        // ... (The logic inside processMdFile needs minor path adjustments if it assumes cwd) ...
        // For now, assume processMdFile takes absolute path and returns chunks
        // NOTE: We'll skip actual image processing for now to focus on flow
        console.log(`  [Step 1/3] Read file content...`);
        const fileContent = await fs.readFile(mdFilePath, 'utf8');
        console.log(`  [Step 2/3] Image replacement SKIPPED (for flow test).`);
        const processedContent = fileContent; // Placeholder
        console.log(`  [Step 3/3] Splitting into chunks...`);
        const { chunks, warnings } = splitMarkdownIntoChunks(processedContent, MIN_CHUNK_LENGTH, MAX_CHUNK_LENGTH, SPLIT_HEADERS);
        warnings.forEach(warning => console.warn(`[Splitter Warn] ${warning}`)); // Log warnings
        console.log(`[Step 3/3] Generated ${chunks.length} chunks from ${relativeMdPath}.`);
        
        // 6. Save Chunks to FINAL Persistent Directory
        const baseOutputFilename = sanitizeFilename(path.basename(relativeMdPath, '.md'));
        const chunkFilePrefix = `${baseOutputFilename}_chunk`;
        let savedChunkCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            // Pad index for consistent sorting
            const chunkIndex = String(i).padStart(3, '0'); 
            // Add unique identifier (like original section index if available) or just index
            // Assuming splitMarkdownIntoChunks provides simple index for now
            const chunkFilename = `${chunkFilePrefix}_${chunkIndex}_${i}.md`; 
            const finalChunkPath = path.join(finalChunksOutputDir, baseOutputFilename, chunkFilename);
            
            try {
                await fs.ensureDir(path.dirname(finalChunkPath)); // Ensure subdirectory for file exists
                await fs.writeFile(finalChunkPath, chunkContent);
                savedChunkCount++;
            } catch (writeError) {
                console.error(`[Preprocess] Error saving chunk ${chunkFilename} to ${finalChunkPath}: ${writeError.message}`);
            }
        }
        console.log(`[Step 4/3] Saved ${savedChunkCount} chunks to: ${path.relative(process.cwd(), path.dirname(path.join(finalChunksOutputDir, baseOutputFilename)))}`);
        totalChunksGenerated += savedChunkCount;
        // --- End Image Processing & Splitting --- 
    }

    console.log(`[Preprocess] Total chunks generated and saved for module ${targetModuleId}: ${totalChunksGenerated}`);
    console.log(`[Preprocess] Preprocessing for module ${targetModuleId} finished successfully.`);

  } catch (error) {
    console.error(`[Preprocess] CRITICAL ERROR during preprocessing for module ${targetModuleId}:`, error.message);
    console.error(error.stack); // Log stack trace for critical errors
    process.exit(1); // Exit with error code
  } finally {
    // 7. Clean up Temporary Directory
    if (tempWorkingDir) {
      console.log(`[Preprocess] Cleaning up temporary working directory ${tempWorkingDir}...`);
      try {
        await fs.remove(tempWorkingDir);
        console.log(`[Preprocess] Successfully removed temporary directory.`);
      } catch (removeError) {
        console.error(`[Preprocess] FAILED to remove temporary directory ${tempWorkingDir}: ${removeError.message}`);
      }
    }
    console.log(`[Preprocess] Finished preprocessing attempt for module: ${targetModuleId}`);
  }
}

// --- Markdown Splitting Logic --- (Simplified for brevity, assumes it exists)
function splitMarkdownIntoChunks(markdownContent, minLength, maxLength, splitHeaders) {
    // Placeholder: This function should contain the actual splitting logic
    // based on headers and length constraints.
    // It should return { chunks: [string], warnings: [string] }
    console.warn("[Splitter] Actual splitting logic is a placeholder.");
    // Simple split by H1/H2 for placeholder
    const lines = markdownContent.split('\n');
    const chunks = [];
    let currentChunk = '';
    for (const line of lines) {
        if ((line.startsWith('# ') || line.startsWith('## ')) && currentChunk.length > 100) { // Arbitrary split point
            chunks.push(currentChunk.trim());
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    return { chunks: chunks.filter(c => c.length > 0), warnings: [] }; // Return empty warnings for placeholder
}

// --- Image Processing Logic --- (Placeholder)
async function processAndReplaceImages(mdContent, mdFilePath, moduleBaseDir) {
    // Placeholder for the complex logic involving finding <img>,
    // calling LLM, generating Mermaid, and replacing.
    console.warn("[Image Processor] Image processing logic is a placeholder.");
    return mdContent; // Return original content for now
}


// --- Run the script ---
console.log(`[Preprocess Script] Invoked for module: ${moduleId}`);
preprocessModule(moduleId);
