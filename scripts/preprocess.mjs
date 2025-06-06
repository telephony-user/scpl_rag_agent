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
const LLM_MODEL_NAME = process.env.MERMAID_LLM_MODEL || 'anthropic/claude-3.5-sonnet'; // Default model

// --- Guard LLM Configuration (for checking if image is a diagram) ---
const GUARD_IMAGE_MODEL = process.env.GUARD_IMAGE_MODEL; // Default to main LLM model if not set
const GUARD_LLM_IMAGE_ENDPOINT =  LLM_IMAGE_ENDPOINT; // Default to main LLM endpoint
const GUARD_LLM_API_KEY =  LLM_API_KEY; // Default to main LLM API key

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
  const mediaSubDir = `./${safeBaseName}_media`; 
  const absoluteMediaDir = path.join(outputDir, `${safeBaseName}_media`);

  console.log(`[Pandoc] Converting: ${path.basename(docxPath)} -> ${outputMdFilename}`);
  console.log(`[Pandoc] Output MD: ${outputMdPath}`);
  console.log(`[Pandoc] Media Dir: ${mediaSubDir} (in ${outputDir})`);

  await fs.ensureDir(outputDir);

  const pandocArgs = [
      '-f', 'docx',
      '-t', 'gfm',
      '--extract-media', mediaSubDir,
      '--wrap=none',
      '-o', outputMdPath,
      docxPath
  ];

  console.log(`[Pandoc] Executing: pandoc ${pandocArgs.join(' ')}`);

  return new Promise((resolve, reject) => {
      const pandocProcess = spawn('pandoc', pandocArgs, {
          cwd: outputDir 
      });
      
      let stdout = '';
      let stderr = '';

      pandocProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      pandocProcess.stderr.on('data', (data) => { stderr += data.toString(); });

      pandocProcess.on('error', (err) => {
          console.error(`[Pandoc] Failed to start Pandoc process for ${path.basename(docxPath)}: ${err.message}`);
          // Log stderr collected so far, if any
          if (stderr) {
              console.error(`[Pandoc Stderr on Error]: ${stderr}`);
          }
          reject(err); // Reject with the spawn error
      });

      pandocProcess.on('close', (code, signal) => {
          console.log(`[Pandoc] Process for ${path.basename(docxPath)} exited with code ${code}, signal ${signal}`);
          if (code === 0) {
              console.log(`[Pandoc] Successfully converted ${path.basename(docxPath)} to ${outputMdPath}`);
              // Optionally log stdout if needed: console.log(`[Pandoc Stdout]: ${stdout}`);
              resolve({ mdPath: outputMdPath, mediaDir: absoluteMediaDir });
          } else {
              // Log the actual error output from Pandoc (stderr)
              console.error(`[Pandoc] Error converting ${path.basename(docxPath)} (code ${code}, signal ${signal})`);
              console.error(`[Pandoc Stderr]: ${stderr || '(No stderr output)'}`);
               // Optionally log stdout: console.error(`[Pandoc Stdout]: ${stdout || '(No stdout output)'}`);
              reject(new Error(`Pandoc failed with code ${code} and signal ${signal}. Stderr: ${stderr}`));
          }
      });
  });
}

// --- Helper: Check if Image is a Diagram (using Guard LLM) ---
const diagramCheckCache = new Map(); // Кэш для результатов проверки isImageADiagram

async function isImageADiagram(imagePath, contextText = '') {
    if (diagramCheckCache.has(imagePath)) {
        const cachedResult = diagramCheckCache.get(imagePath);
        console.log(`[Guard LLM Cache] Using cached result for ${imagePath}: ${cachedResult}`);
        return cachedResult;
    }

    if (!GUARD_LLM_IMAGE_ENDPOINT || !GUARD_LLM_API_KEY) {
        console.warn('[Guard LLM] Guard LLM endpoint or API key not configured. Assuming image IS a diagram to maintain previous behavior.');
        diagramCheckCache.set(imagePath, true); // Сохраняем результат по умолчанию в кэш
        return true; // Default to true if guard LLM is not configured
    }
    console.log(`[Guard LLM] Checking if image is a diagram: ${imagePath}`);
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';

        const requestBody = {
            model: GUARD_IMAGE_MODEL,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Is this image a diagram, flowchart, or schematic suitable for Mermaid representation? Or is it a simple icon, photo, or decorative symbol? Respond with only 'yes' or 'no'. ${contextText ? 'Context: ' + contextText : ''}`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 10 // Expecting a very short response
        };

        console.log(`[Guard LLM] Sending request to ${GUARD_IMAGE_MODEL} for ${imagePath}...`);
        const response = await axios.post(GUARD_LLM_IMAGE_ENDPOINT, requestBody, {
            headers: {
                'Authorization': `Bearer ${GUARD_LLM_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Title': 'Guard LLM Image Check'
            }
        });

        let resultText = null;
        if (response.status === 200 && response.data && Array.isArray(response.data.choices) && response.data.choices.length > 0) {
            const choice = response.data.choices[0];
            if (choice.message && typeof choice.message.content === 'string') {
                resultText = choice.message.content.trim().toLowerCase();
                console.log(`[Guard LLM] Received response for ${imagePath}: "${resultText}"`);
            } else {
                console.warn(`[Guard LLM] Unexpected response structure from Guard LLM for ${imagePath}. Assuming it's not a diagram.`);
                console.debug('[Guard LLM] Response data:', response.data);
                diagramCheckCache.set(imagePath, false); // Кэшируем результат
                return false;
            }
        } else {
            console.warn(`[Guard LLM] Unexpected status or response format from Guard LLM for ${imagePath}. Assuming it's not a diagram. Status: ${response.status}`);
            console.debug('[Guard LLM] Response data:', response.data);
            diagramCheckCache.set(imagePath, false); // Кэшируем результат
            return false;
        }

        if (resultText === 'yes') {
            console.log(`[Guard LLM] Image ${imagePath} IS a diagram.`);
            diagramCheckCache.set(imagePath, true); // Кэшируем результат
            return true;
        } else if (resultText === 'no') {
            console.log(`[Guard LLM] Image ${imagePath} is NOT a diagram.`);
            diagramCheckCache.set(imagePath, false); // Кэшируем результат
            return false;
        } else {
            console.warn(`[Guard LLM] Ambiguous response from Guard LLM for ${imagePath}: "${resultText}". Expected 'yes' or 'no'. Assuming it's not a diagram.`);
            diagramCheckCache.set(imagePath, false); // Кэшируем результат
            return false;
        }

    } catch (error) {
        console.error(`[Guard LLM] Error checking image ${imagePath}:`, error.response ? JSON.stringify(error.response.data) : error.message);
        if (error.stack) { console.error(error.stack); }
        console.warn(`[Guard LLM] Due to error, assuming image ${imagePath} is NOT a diagram.`);
        diagramCheckCache.set(imagePath, false); // Кэшируем результат при ошибке
        return false; // Default to false on error
    }
}

// --- Image Processing Logic --- (Using messages format for image)
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
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';
        console.log(`[Mermaid Generator] Определен MIME-тип: ${mimeType} для ${imagePath}`);

        // Construct the request body using the standard messages format for vision models
        const requestBody = {
            model: LLM_MODEL_NAME,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Generate a Mermaid diagram code representing the content of this image. ${contextText ? 'Context: ' + contextText : ''}`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            // Optionally add max_tokens if needed, e.g.:
            // max_tokens: 1024 
        };

        console.log(`[Mermaid Generator] Запрос к LLM (${LLM_MODEL_NAME}) для ${imagePath} с использованием формата messages...`);
        const response = await axios.post(LLM_IMAGE_ENDPOINT, requestBody, {
            headers: {
                'Authorization': `Bearer ${LLM_API_KEY}`,
                'Content-Type': 'application/json', 
                'X-Title': 'Mermaid Diagram Generator'

            }
        });

        // Check response structure: look for choices[0].message.content or choices[0].text
        let resultText = null;
        if (response.status === 200 && response.data && Array.isArray(response.data.choices) && response.data.choices.length > 0) {
            const choice = response.data.choices[0];
            if (choice.message && typeof choice.message.content === 'string') {
                resultText = choice.message.content;
                console.log(`[Mermaid Generator] Получен ответ от LLM (из message.content) для ${imagePath}. Статус: ${response.status}.`);
            } else if (typeof choice.text === 'string') { // Fallback for models that might use choice.text
                resultText = choice.text;
                console.log(`[Mermaid Generator] Получен ответ от LLM (из choice.text) для ${imagePath}. Статус: ${response.status}.`);
            } else {
                console.error(`[Mermaid Generator] Неожиданная структура ответа (choices[0] не содержит message.content или text) от LLM для ${imagePath}. Тело ответа:`, response.data);
            }
        } else {
            console.error(`[Mermaid Generator] Неожиданный формат ответа или статус от LLM для ${imagePath}. Статус: ${response.status}, Тело ответа:`, response.data);
        }

        // Process the extracted text if found
        if (resultText !== null) {
            let rawResponseText = resultText.trim();
            // Trim backticks and 'mermaid' label
            if (rawResponseText.startsWith('```mermaid')) {
                rawResponseText = rawResponseText.substring('```mermaid'.length);
            }
            if (rawResponseText.startsWith('```')) {
                rawResponseText = rawResponseText.substring(3);
            }
            if (rawResponseText.endsWith('```')) {
                rawResponseText = rawResponseText.substring(0, rawResponseText.length - 3);
            }
            const cleanedText = rawResponseText.trim();
            console.log(`[Mermaid Generator] Извлеченный и очищенный текст: "${cleanedText.substring(0, 100)}..."`);
            return cleanedText; // Return the processed text
        } else {
            return null; // Indicate failure to get valid text
        }

    } catch (error) {
        // Log network/request errors
        console.error(`[Mermaid Generator] Ошибка при запросе к LLM для ${imagePath}:`, error.response ? JSON.stringify(error.response.data) : error.message);
        // Log stack trace for network errors
        if (error.stack) { console.error(error.stack); } 
        return null; // Return null on error
    }
}

async function processAndReplaceImages(mdContent, mdFilePath) {
    console.log(`[Main Processor] Начало обработки файла (замена изображений): ${mdFilePath}`);
    const mdDir = path.dirname(mdFilePath);
    let processedMdContent = mdContent;
    const imageReplacements = []; // Store { placeholder, mermaidCode }

    // Log lines containing img tags for debugging
    console.log(`[Main Processor Debug] Проверка содержимого MD на наличие <img тегов:`);
    const linesWithImg = mdContent.split('\n').filter(line => line.includes('<img'));
    if (linesWithImg.length > 0) {
        linesWithImg.forEach(line => console.log(`[Main Processor Debug] Найдена строка: ${line.trim()}`));
    } else {
        console.log(`[Main Processor Debug] Строки с <img не найдены в содержимом.`);
    }
    console.log(`[Main Processor Debug] Конец проверки содержимого.`);

    // Use a simpler regex
    const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;

    console.log(`[Main Processor] Поиск HTML <img> тегов с использованием regex...`);
    const promises = [];
    let foundHtmlImgCount = 0; // Total HTML img tags found
    let processedForLlmCount = 0; // Count of images sent to Mermaid LLM
    let skippedSvgCount = 0;
    let skippedNotDiagramCount = 0; // Count of images skipped as not diagrams
    let skippedFileNotFoundCount = 0; // Count of images skipped because file not found

    while ((match = imgRegex.exec(mdContent)) !== null) {
        foundHtmlImgCount++;
        const fullMatch = match[0];
        // Group 1 captures the src value in the new regex
        const imgSrc = match[1];

        if (!imgSrc) {
            console.log(`[Main Processor Debug] Regex нашел совпадение, но не смог извлечь src: ${fullMatch}`);
            continue;
        }

        console.log(`[Main Processor Debug] Regex нашел тег #${foundHtmlImgCount}: ${fullMatch} | Извлеченный src: ${imgSrc}`);
        const isSvg = imgSrc.toLowerCase().endsWith('.svg');

        if (isSvg && SKIP_SVG) {
            console.log(`[Main Processor] Пропущен SVG HTML тег (SKIP_SVG=true): ${imgSrc}`);
            skippedSvgCount++;
            continue;
        }
        if (isSvg && !SKIP_SVG) {
             console.log(`[Main Processor] Обработка SVG тега (пропуск LLM, SKIP_SVG=false): ${imgSrc}`);
             // SVGs are not sent to LLM, img tag remains
             continue;
        }

        // For non-SVG images, resolve path and check existence
        const absoluteImagePath = path.resolve(mdDir, imgSrc);

        if (!await fs.pathExists(absoluteImagePath)) {
            console.warn(`[Main Processor] Файл изображения не найден: ${absoluteImagePath} (src: ${imgSrc}). Тег <img> будет пропущен.`);
            skippedFileNotFoundCount++;
            continue; // Skip this image, leave the <img> tag as is
        }

        // Check if the image is a diagram using Guard LLM
        console.log(`[Main Processor] Проверка, является ли ${absoluteImagePath} диаграммой...`);
        const isDiagram = await isImageADiagram(absoluteImagePath);
        if (!isDiagram) {
            console.log(`[Main Processor] Изображение ${absoluteImagePath} не является диаграммой (согласно Guard LLM). Тег <img> будет сохранен.`);
            skippedNotDiagramCount++;
            continue; // Skip LLM processing, leave <img> tag as is
        }

        // If we reach here, it's a non-SVG image, it exists, and it's considered a diagram
        processedForLlmCount++;
        console.log(`[Main Processor] Найдено изображение #${processedForLlmCount} для обработки LLM (не SVG, существует, диаграмма): ${imgSrc}`);
        const placeholder = `%%%MERMAID_PLACEHOLDER_${imageReplacements.length}%%%`;
        processedMdContent = processedMdContent.replace(fullMatch, placeholder);

        // Push the promise to the array
        promises.push(
            (async () => {
                console.log(`[Main Processor] Обработка изображения: ${imgSrc} (ожидаем ответ LLM)`);
                const llmResultText = await getMermaidDiagramFromImage(absoluteImagePath);
                // Add replacement if LLM call didn't result in null (i.e., no network/config error)
                if (llmResultText !== null) { 
                    imageReplacements.push({ placeholder, mermaidCode: llmResultText }); // Store the raw result
                    if (llmResultText === '') {
                         console.warn(`[Main Processor] LLM вернул пустой текст для ${imgSrc} после очистки. Будет вставлен пустой блок Mermaid.`);
                    }
                } else {
                    // Log failure if getMermaidDiagramFromImage returned null
                    console.error(`[Main Processor] Не удалось получить ответ от LLM для ${imgSrc} из-за ошибки конфигурации или сети. Placeholder останется.`);
                }
            })()
        );
    }

    console.log(`[Main Processor] Поиск HTML <img> завершен. Всего найдено: ${foundHtmlImgCount}.`);
    console.log(`  Пропущено SVG (SKIP_SVG=${SKIP_SVG}): ${skippedSvgCount}.`);
    console.log(`  Пропущено из-за отсутствия файла: ${skippedFileNotFoundCount}.`);
    console.log(`  Пропущено (не диаграмма по Guard LLM): ${skippedNotDiagramCount}.`);
    console.log(`  Отправлено на обработку в Mermaid LLM: ${processedForLlmCount}.`);

    // Wait for all LLM calls to complete
    if (promises.length > 0) {
        await Promise.all(promises);
        console.log(`[Main Processor] Все запросы к LLM для изображений (${promises.length}) завершены.`);
    } else {
         console.log(`[Main Processor] Запросы к LLM не выполнялись.`);
    }

    // Apply replacements
    console.log(`[Main Processor] Применение ${imageReplacements.length} замен (непроверенных ответов LLM)...`);
    imageReplacements.forEach(({ placeholder, mermaidCode }) => {
        // Ensure mermaidCode is a string, default to empty if somehow it isn't (though should be handled above)
        const codeToInsert = typeof mermaidCode === 'string' ? mermaidCode : ''; 
        processedMdContent = processedMdContent.replace(placeholder, `\n\`\`\`mermaid\n${codeToInsert}\n\`\`\`\n`);
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
    // Check if this directory actually exists
    if (!await fs.pathExists(tempSourceModuleDir)) {
        console.error(`[Preprocess] Error: Module directory '${targetModuleId}' not found within the cloned repository: ${tempSourceModuleDir}`);
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
        // Ensure the main chunks output directory exists
        await fs.ensureDir(finalChunksOutputDir); 
        
        let savedChunkCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const chunkIndex = String(i).padStart(3, '0');
            // Use a filename combining original base name and chunk index
            const chunkFilename = `${baseOutputFilename}_chunk_${chunkIndex}.md`;
            // Save directly to the final chunks output directory
            const finalChunkPath = path.join(finalChunksOutputDir, chunkFilename); 

            try {
                await fs.writeFile(finalChunkPath, chunkContent);
                savedChunkCount++;
            } catch (writeError) {
                console.error(`[Preprocess] Error saving chunk ${chunkFilename} to ${finalChunkPath}: ${writeError.message}`);
            }
        }
        // Update log message to reflect the correct directory
        console.log(`[Step 4/3] Saved ${savedChunkCount} chunks to: ${path.relative(process.cwd(), finalChunksOutputDir)}`); 
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

