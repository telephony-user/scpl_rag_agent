const path = require('path');
const fs = require('fs').promises;
const { execFile } = require('child_process');
const util = require('util');

const execFilePromise = util.promisify(execFile);

/**
 * Converts a DOCX file to Markdown using Pandoc.
 * @param {string} inputDocxPath Full path to the input .docx file.
 * @param {string} outputDir Directory where the .md file and media folder should be created.
 * @returns {Promise<string>} Path to the created Markdown file.
 * @throws {Error} If Pandoc execution fails.
 */
async function convertDocxToMd(inputDocxPath, outputDir) {
    const docxFileName = path.basename(inputDocxPath);
    const baseName = path.basename(docxFileName, '.docx');
    // Sanitize baseName slightly for use in paths/filenames if needed
    const sanitizedBaseName = baseName.replace(/[^a-z0-9_\\-\\.]/gi, '_');

    const outputMdFileName = `${sanitizedBaseName}.md`;
    const outputMdPath = path.join(outputDir, outputMdFileName);
    const mediaDirName = `${sanitizedBaseName}_media`; // Folder for extracted media relative to outputDir
    const mediaDirPathAbsolute = path.join(outputDir, mediaDirName); // Absolute path for creation
    const mediaDirRelative = `./${mediaDirName}`; // Relative path for pandoc --extract-media arg

    console.log(`[Pandoc] Converting: ${docxFileName} -> ${outputMdFileName}`);
    console.log(`[Pandoc] Output MD: ${outputMdPath}`);
    console.log(`[Pandoc] Media Dir: ${mediaDirRelative} (in ${outputDir})`);

    try {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });
        // Ensure media directory exists (Pandoc might create it, but let's be sure)
        await fs.mkdir(mediaDirPathAbsolute, { recursive: true });

        const pandocArgs = [
            '-f', 'docx',                     // Input format
            '-t', 'gfm',                      // Output format (GitHub Flavored Markdown)
            '--extract-media', mediaDirRelative, // Extract media to relative path
            '--wrap=none',                    // Do not wrap lines
            '-o', outputMdPath,               // Output file path
            inputDocxPath                     // Input file path
        ];

        console.log(`[Pandoc] Executing: pandoc ${pandocArgs.join(' ')}`);

        // Note: Pandoc writes to stdout on success (if -o is not used) and stderr for messages/errors.
        // We use -o, so stdout might be empty on success. stderr might contain warnings.
        const { stdout, stderr } = await execFilePromise('pandoc', pandocArgs, { cwd: outputDir }); // Run pandoc with outputDir as cwd for relative media path

        if (stderr) {
            // Log warnings but don't necessarily throw an error unless the exit code was non-zero (handled by execFilePromise reject)
            console.warn(`[Pandoc] Warnings/Messages during conversion of ${docxFileName}:\n${stderr}`);
        }

        console.log(`[Pandoc] Successfully converted ${docxFileName} to ${outputMdPath}`);
        return outputMdPath;

    } catch (error) {
        console.error(`[Pandoc] Error converting ${docxFileName}:`, error);
        // Rethrow the error to be caught by the caller
        throw new Error(`Pandoc failed for ${docxFileName}: ${error.message}`);
    }
}

// Export the function using CommonJS syntax
module.exports = { convertDocxToMd };

/*
// Original self-executing test code (removed)
(async () => {
  // ... test logic ...
})();
*/