import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { URL } from 'url';

// Load environment variables
dotenv.config();

// --- Configuration ---
const SOURCE_MD_ROOT_DIR = process.env.SOURCE_MD_ROOT_DIR || 'source_md'; // Root dir for cloned repo
const OUTPUT_DIR = process.env.PREPROCESS_OUTPUT_DIR || 'output'; // Kept for potential future use, but JSON output is removed
const MIN_CHUNK_CHAR_LENGTH = parseInt(process.env.MIN_CHUNK_CHAR_LENGTH || '3000', 10); // New: Min chunk length
const MAX_CHUNK_CHAR_LENGTH = parseInt(process.env.MAX_CHUNK_CHAR_LENGTH || '5000', 10); // Updated: Max chunk length
const PANDOC_OUTPUT_SUBDIR = 'converted_md'; // Subdirectory within module dir for converted files
const CHUNKS_OUTPUT_SUBDIR = 'processed_chunks'; // Subdirectory for individual chunk files

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Argument Parsing ---
const argv = yargs(hideBin(process.argv))
  .option('module', {
    alias: 'm',
    description: 'The ID of the module to preprocess',
    type: 'string',
    demandOption: true, // Make module ID mandatory
  })
  .help()
  .alias('help', 'h')
  .parse();

const moduleId = argv.module;
const moduleSourceDir = path.resolve(SOURCE_MD_ROOT_DIR, moduleId);
const pandocOutputDir = path.resolve(moduleSourceDir, PANDOC_OUTPUT_SUBDIR); // Place converted MDs inside module dir
const chunksBaseOutputDir = path.resolve(moduleSourceDir, CHUNKS_OUTPUT_SUBDIR); // Base dir for chunk markdown files

// --- Dynamic Import for CommonJS Module ---
// We need to dynamically import the CJS module since this is an ESM module
async function importPandocConverter() {
    // Simply use the relative path; Node should resolve it correctly
    // Make sure the path uses forward slashes for cross-platform compatibility
    const relativeConverterPath = '../src/utils/pandoc_converter.cjs';
    const { convertDocxToMd } = await import(relativeConverterPath);
    return convertDocxToMd;
}

// --- Import ES Modules ---
import { fetchAndUpdateRepo } from '../src/utils/git_fetcher.js';
import { replaceImagesWithMermaid } from '../src/utils/image_to_mermaid.js';
import { splitMarkdown } from '../src/utils/splitMarkdown.js';

// --- Main Preprocessing Logic ---
async function preprocessModule(targetModuleId) {
  console.log(`[Preprocess] Starting preprocessing for module: ${targetModuleId}`);

  // Step 0: Fetch/Update documentation repository
  try {
      console.log('[Preprocess] Ensuring documentation repository is up-to-date...');
      await fetchAndUpdateRepo(); // Call before main logic
      console.log('[Preprocess] Documentation repository check complete.');
  } catch (gitError) {
      // fetchAndUpdateRepo should handle its internal errors and exit if critical,
      // but we catch here just in case it throws unexpectedly.
      console.error('[Preprocess] Failed to fetch/update documentation repository. Aborting.', gitError);
      process.exit(1);
  }

  console.log(`[Preprocess] Source directory: ${moduleSourceDir}`);

  const convertDocxToMd = await importPandocConverter();
  let totalChunksGenerated = 0;

  try {
    // 1. Ensure source directory exists
    try {
      await fs.access(moduleSourceDir);
    } catch (error) {
      console.error(`[Preprocess] Error: Source directory not found: ${moduleSourceDir}`);
      process.exit(1);
    }

    // Ensure output directories exist
    await fs.mkdir(pandocOutputDir, { recursive: true });
    await fs.mkdir(chunksBaseOutputDir, { recursive: true }); // Ensure base dir for chunks exists

    // 2. Find and convert DOCX files
    console.log('[Preprocess] Searching for .docx files...');
    const docxFiles = await glob('**/*.docx', {
        cwd: moduleSourceDir,
        nodir: true,
        ignore: [
            `${PANDOC_OUTPUT_SUBDIR}/**`,
            `${CHUNKS_OUTPUT_SUBDIR}/**`, // Ignore chunks output dir
            '**/node_modules/**',
            '**/~$*.docx' // Ignore Word temporary files
        ]
    });
    console.log(`[Preprocess] Found ${docxFiles.length} .docx files.`);

    const conversionPromises = docxFiles.map(async (docxFile) => {
        const inputPath = path.join(moduleSourceDir, docxFile);
        // Output MD will be placed in pandocOutputDir
        try {
            console.log(`[Preprocess] Converting ${docxFile}...`);
            const mdPath = await convertDocxToMd(inputPath, pandocOutputDir);
            console.log(`[Preprocess] Converted ${docxFile} to ${path.relative('.', mdPath)}`);
            return mdPath; // Return path to converted file
        } catch (error) {
            console.error(`[Preprocess] Failed to convert ${docxFile}: ${error.message}`);
            return null; // Indicate failure
        }
    });

    const convertedMdPaths = (await Promise.all(conversionPromises)).filter(p => p !== null);
    console.log(`[Preprocess] Successfully converted ${convertedMdPaths.length} .docx files.`);

    // 3. Find all MD files (original and converted)
    console.log('[Preprocess] Searching for all .md files (original and converted)...');
    // Search in both moduleSourceDir and pandocOutputDir, excluding node_modules and chunk output
    const mdFiles = await glob(['**/*.md', `${PANDOC_OUTPUT_SUBDIR}/**/*.md`], {
         cwd: moduleSourceDir,
         nodir: true,
         absolute: true,
         ignore: [
            '**/node_modules/**',
            `${CHUNKS_OUTPUT_SUBDIR}/**` // Ignore chunk files
        ]
        });
    // Filter out duplicates if any somehow arise from glob patterns
    const uniqueMdFiles = [...new Set(mdFiles)];

    console.log(`[Preprocess] Found ${uniqueMdFiles.length} unique .md files to process.`);

    // 4. Process each MD file
    for (const mdFilePath of uniqueMdFiles) {
      const relativeMdPath = path.relative(moduleSourceDir, mdFilePath);
      const sourceFileName = path.basename(mdFilePath);
      const sourceFileBaseName = path.parse(sourceFileName).name;
      const fileSpecificChunkDir = path.join(chunksBaseOutputDir, sourceFileBaseName);
      console.log(`\n[Preprocess] Processing MD file: ${relativeMdPath}`);

      try {
        // Ensure directory for this file's chunks exists
        await fs.mkdir(fileSpecificChunkDir, { recursive: true });

        // Read file
        let mdContent = await fs.readFile(mdFilePath, 'utf-8');
        console.log(`  [Step 1/3] Read file content (${mdContent.length} chars).`);

        // Replace images with Mermaid (uses LLM)
        console.log('  [Step 2/3] Replacing images with Mermaid diagrams (calling LLM)...');
        mdContent = await replaceImagesWithMermaid(mdContent, mdFilePath); // Pass full path for image resolution
        console.log('  [Step 2/3] Image replacement finished.');

        // Split into chunks
        console.log(`  [Step 3/3] Splitting into chunks (H1-H6, Min Length: ${MIN_CHUNK_CHAR_LENGTH}, Max Length: ${MAX_CHUNK_CHAR_LENGTH})...`);
        const chunks = await splitMarkdown(
          mdContent,
          sourceFileName,
          targetModuleId,
          MAX_CHUNK_CHAR_LENGTH,
          MIN_CHUNK_CHAR_LENGTH
        );
        console.log(`  [Step 3/3] Generated ${chunks.length} chunks from ${relativeMdPath}.`);
        totalChunksGenerated += chunks.length;

        // Save each chunk as a separate MD file
        for (const chunk of chunks) {
            const chunkIndexPadded = String(chunk.chunk_index).padStart(3, '0');
            const subChunkIndexPadded = String(chunk.sub_chunk_index).padStart(3, '0');
            // Filename: <original_base>_chunk_<chunk_idx>_<subchunk_idx>.md
            const chunkFileName = `${sourceFileBaseName}_chunk_${chunkIndexPadded}_${subChunkIndexPadded}.md`;
            const chunkOutputPath = path.join(fileSpecificChunkDir, chunkFileName);
            try {
                await fs.writeFile(chunkOutputPath, chunk.text); // Save the chunk text
                // console.log(`    [Save Chunk] Saved: ${path.relative('.', chunkOutputPath)}`); // Optional: log each save
            } catch (writeError) {
                 console.error(`    [Save Chunk] Error writing chunk file ${chunkFileName}:`, writeError);
            }
        }
         if (chunks.length > 0) {
             console.log(`  [Step 4/3] Saved ${chunks.length} chunks to: ${path.relative('.', fileSpecificChunkDir)}`);
         }

      } catch (error) {
        console.error(`[Preprocess] Error processing file ${relativeMdPath}:`, error);
        // Continue with the next file
      }
    }

    console.log(`\n[Preprocess] Total chunks generated and saved for module ${targetModuleId}: ${totalChunksGenerated}`);

    console.log(`[Preprocess] Preprocessing for module ${targetModuleId} finished.`);

  } catch (error) {
    console.error(`[Preprocess] An unexpected error occurred during preprocessing for module ${targetModuleId}:`, error);
    process.exit(1);
  }
}

// --- Run the script ---
preprocessModule(moduleId);
