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
import axios from 'axios'; // Needed for LLM call

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
const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME || 'anthropic/claude-3.5-sonnet'; // Default model

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

// --- Image Processing Logic --- (Restored)
async function getMermaidDiagramFromImage(imagePath, contextText = '') {
    if (!LLM_IMAGE_ENDPOINT || !LLM_API_KEY) {
        console.warn('[Mermaid Generator] LLM endpoint or API key not configured. Skipping image processing.');
        return null;
    }
    console.log(`[Mermaid Generator] Начало генерации для ${imagePath}`);
    try {
        console.log(`[Mermaid Generator] Попытка чтения изображения: ${imagePath}`);
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        console.log(`[Mermaid Generator] Файл изображения ${imagePath} успешно прочитан.`);

        // Basic MIME type detection from extension
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';
        console.log(`[Mermaid Generator] Определен MIME-тип: ${mimeType} для ${imagePath}`);

        const requestBody = {
            model: LLM_MODEL_NAME,
            prompt: `Generate a Mermaid diagram code representing the content of this image. ${contextText ? 'Context: ' + contextText : ''}`,
            images: [base64Image]
        };

        console.log(`[Mermaid Generator] Запрос к LLM (${LLM_MODEL_NAME}) для ${imagePath}...`);
        const response = await axios.post(LLM_IMAGE_ENDPOINT, requestBody, {
            headers: {
                'Authorization': `Bearer ${LLM_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200 && response.data && response.data.response) {
             // Extract Mermaid code, removing backticks and 'mermaid' label if present
            let mermaidCode = response.data.response.trim();
            if (mermaidCode.startsWith('```mermaid')) {
                mermaidCode = mermaidCode.substring('```mermaid'.length);
            }
            if (mermaidCode.startsWith('```')) {
                 mermaidCode = mermaidCode.substring(3);
            }
             if (mermaidCode.endsWith('```')) {
                mermaidCode = mermaidCode.substring(0, mermaidCode.length - 3);
            }
            console.log(`[Mermaid Generator] Успешно получен Mermaid код для ${imagePath}.`);
            return mermaidCode.trim();
        } else {
            console.error(`[Mermaid Generator] Ошибка ответа LLM для ${imagePath}:`, response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error(`[Mermaid Generator] Ошибка обработки изображения ${imagePath}:`, error.response ? error.response.data : error.message);
        return null;
    }
}

async function processAndReplaceImages(mdContent, mdFilePath) {
    console.log(`[Main Processor] Начало обработки файла (замена изображений): ${mdFilePath}`);
    const mdDir = path.dirname(mdFilePath);
    let processedMdContent = mdContent;
    const imageReplacements = []; // Store { placeholder, mermaidCode }

    // Regex to find <img> tags, capturing src
    const imgRegex = /<img\\s+[^>]*?src=(?:\"([^\"]+)\"|\'([^\']+)\')[^>]*>/gi;
    let match;

    console.log(`[Main Processor] Поиск HTML <img> тегов...`);
    const promises = [];

    while ((match = imgRegex.exec(mdContent)) !== null) {
        const fullMatch = match[0];
        const imgSrc = match[1] || match[2]; // Get src value from quotes

        if (!imgSrc) continue;

        const isSvg = imgSrc.toLowerCase().endsWith('.svg');

        if (isSvg && SKIP_SVG) {
            console.log(`[Main Processor] Пропущен SVG HTML тег: ${fullMatch}`);
            continue;
        }
        if (isSvg && !SKIP_SVG) {
             console.log(`[Main Processor] Обработка SVG тега: ${fullMatch} (пропуск LLM)`);
             // Optionally handle SVG differently if needed, e.g., keep the tag
             continue;
        }

        console.log(`[Main Processor] Найдено совпадение HTML img (не SVG): ${fullMatch}`);
        const absoluteImagePath = path.resolve(mdDir, imgSrc);
        const placeholder = `%%%MERMAID_PLACEHOLDER_${imageReplacements.length}%%%`;
        processedMdContent = processedMdContent.replace(fullMatch, placeholder);

        // Push the promise to the array
        promises.push(
            (async () => {
                console.log(`[Main Processor] Обработка изображения: ${imgSrc} (ожидаем ответ LLM)`);
                const mermaidCode = await getMermaidDiagramFromImage(absoluteImagePath);
                if (mermaidCode) {
                    imageReplacements.push({ placeholder, mermaidCode });
                } else {
                    // If failed, maybe put back the original tag or a comment?
                    console.warn(`[Main Processor] Не удалось сгенерировать Mermaid для ${imgSrc}. Placeholder останется.`);
                    // Keep placeholder for now, could be replaced with original later if needed
                }
            })()
        );
    }

    console.log(`[Main Processor] Найдено ${promises.length} HTML <img> тегов (не SVG) для обработки.`);

    // Wait for all LLM calls to complete
    await Promise.all(promises);
    console.log(`[Main Processor] Все запросы к LLM для изображений завершены.`);

    // Apply replacements
    console.log(`[Main Processor] Применение ${imageReplacements.length} замен...`);
    imageReplacements.forEach(({ placeholder, mermaidCode }) => {
        processedMdContent = processedMdContent.replace(placeholder, `\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`);
    });

    console.log(`[Main Processor] Обработка файла ${mdFilePath} (замена изображений) завершена.`);
    return processedMdContent;
}

// --- Markdown Splitting Logic --- (Restored)
function splitMarkdownIntoChunks(markdownContent, minLength, maxLength, splitHeaders) {
    const processor = unified().use(remarkParse).use(remarkStringify);
    const tree = processor.parse(markdownContent);
    const chunks = [];
    const warnings = [];
    let currentChunkContent = [];
    let currentChunkLength = 0;
    let currentChunkHeaders = []; // Store headers leading to the current chunk

    function stringifyNodes(nodes) {
        if (!nodes || nodes.length === 0) return '';
        // Create a temporary root node to stringify children
        const tempTree = { type: 'root', children: nodes }; 
        return processor.stringify(tempTree).trim();
    }

    function addChunk() {
        if (currentChunkContent.length > 0) {
            const chunkText = stringifyNodes(currentChunkContent);
            const chunkLength = chunkText.length;
            
            if (chunkLength > 0) { // Only add non-empty chunks
                 // Prepend headers to the chunk text
                const headerText = currentChunkHeaders.map(h => processor.stringify(h)).join('\n\n');
                const finalChunkText = headerText ? `${headerText}\n\n${chunkText}` : chunkText;
                const finalChunkLength = finalChunkText.length;

                chunks.push(finalChunkText);
                
                 // Check length constraints and issue warnings
                if (finalChunkLength < minLength) {
                    warnings.push(`Final chunk ${chunks.length} is smaller than min length (${finalChunkLength} < ${minLength}). Headers: ${currentChunkHeaders.map(h => hastToString(h)).join(' > ')}`);
                }
                if (finalChunkLength > maxLength) {
                     // This warning might occur if a single paragraph/block is too large
                    warnings.push(`Final chunk ${chunks.length} exceeds max length (${finalChunkLength} > ${maxLength}) possibly due to large paragraph/block. Headers: ${currentChunkHeaders.map(h => hastToString(h)).join(' > ')}`);
                }
            }
        }
        currentChunkContent = [];
        currentChunkLength = 0;
        // Headers are managed by the visit function
    }

    visit(tree, (node) => {
        if (node.type === 'heading') {
            const headerLevel = `h${node.depth}`;
            // Update current header hierarchy
            while (currentChunkHeaders.length >= node.depth) {
                 currentChunkHeaders.pop();
            }
            currentChunkHeaders.push(node);
            
            // If this header type is a split point AND the current chunk has content
            if (splitHeaders.includes(headerLevel) && currentChunkLength >= minLength) {
                addChunk(); // Finalize the previous chunk
            }
             // Add the header itself to the new chunk content (handled below)
        }
        
        // Stringify the current node to estimate its length
        const nodeText = processor.stringify(node);
        const nodeLength = nodeText.length;
        
        // Check if adding this node exceeds max length (and we already have min length)
        if (currentChunkLength >= minLength && (currentChunkLength + nodeLength) > maxLength && currentChunkContent.length > 0) {
           addChunk(); // Finalize the previous chunk before adding this node
           // Carry over headers to the new chunk started by this node
        }
        
        // Add the node to the current chunk
        currentChunkContent.push(node);
        currentChunkLength += nodeLength;
    });

    // Add the last remaining chunk
    addChunk();

    console.log(`[Splitter] Splitting complete. Generated ${chunks.length} chunks.`);
    return { chunks, warnings };
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
    const mdFiles = await glob([`*.md`, `${CONVERTED_MD_SUBDIR}/*.md`], { cwd: tempSourceModuleDir, absolute: true });
    const uniqueMdFiles = [...new Set(mdFiles)];
    console.log(`[Preprocess] Found ${uniqueMdFiles.length} unique .md files to process.`);

    let totalChunksGenerated = 0;
    await fs.ensureDir(finalChunksOutputDir);
    await fs.emptyDir(finalChunksOutputDir); // Clear old chunks before saving new ones

    for (const mdFilePath of uniqueMdFiles) {
        const relativeMdPath = path.relative(tempSourceModuleDir, mdFilePath);
        console.log(`[Preprocess] Processing MD file: ${relativeMdPath}`);
        
        // --- Image Processing & Splitting Logic --- 
        console.log(`  [Step 1/3] Read file content...`);
        let fileContent = await fs.readFile(mdFilePath, 'utf8');
        console.log(`    Read ${fileContent.length} characters.`);
        
        console.log(`  [Step 2/3] Replacing images with Mermaid diagrams (calling LLM)...`);
        // Pass absolute path for image resolution within processAndReplaceImages
        const processedContentWithMermaid = await processAndReplaceImages(fileContent, mdFilePath); 
        console.log(`  [Step 2/3] Image replacement finished.`);

        console.log(`  [Step 3/3] Splitting into chunks (Min: ${MIN_CHUNK_LENGTH}, Max: ${MAX_CHUNK_LENGTH})...`);
        // Use the restored splitting logic
        const { chunks, warnings } = splitMarkdownIntoChunks(processedContentWithMermaid, MIN_CHUNK_LENGTH, MAX_CHUNK_LENGTH, SPLIT_HEADERS);
        warnings.forEach(warning => console.warn(`[Splitter Warn] ${warning} (File: ${relativeMdPath})`)); // Log warnings with file context
        console.log(`[Step 3/3] Generated ${chunks.length} chunks from ${relativeMdPath}.`);
        
        // 6. Save Chunks to FINAL Persistent Directory
        const baseOutputFilename = sanitizeFilename(path.basename(relativeMdPath, '.md'));
        const fileSpecificFinalChunkDir = path.join(finalChunksOutputDir, baseOutputFilename);
        // Ensure the directory for THIS file's chunks exists in persistent storage
        await fs.ensureDir(fileSpecificFinalChunkDir);
        
        let savedChunkCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const chunkIndex = String(i).padStart(3, '0');
            // Use a simpler filename for now, can be enhanced with metadata later
            const chunkFilename = `${baseOutputFilename}_chunk_${chunkIndex}.md`;
            const finalChunkPath = path.join(fileSpecificFinalChunkDir, chunkFilename);

            try {
                await fs.writeFile(finalChunkPath, chunkContent);
                savedChunkCount++;
            } catch (writeError) {
                console.error(`[Preprocess] Error saving chunk ${chunkFilename} to ${finalChunkPath}: ${writeError.message}`);
            }
        }
        console.log(`[Step 4/3] Saved ${savedChunkCount} chunks to: ${path.relative(process.cwd(), fileSpecificFinalChunkDir)}`);
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

// --- Run the script ---
console.log(`[Preprocess Script] Invoked for module: ${moduleId}`);
preprocessModule(moduleId);
