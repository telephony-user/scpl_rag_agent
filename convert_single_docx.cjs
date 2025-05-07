const path = require('path');
const { convertDocxToMd } = require('./src/utils/pandoc_converter.cjs'); // Убедитесь, что путь правильный

// --- Настройки ---
// Используйте process.argv для получения путей из командной строки
// process.argv[0] is node executable
// process.argv[1] is the script file
const inputDocxArg = process.argv[2];
const outputDirArg = process.argv[3];

if (!inputDocxArg || !outputDirArg) {
    console.error("Пожалуйста, укажите путь к входному .docx файлу и путь к выходной директории.");
    console.error("Пример: node convert_single_docx.cjs \"pandoc sandbox/Demo-Meetups-Recordings-v4-20250131-115822.docx\" \"pandoc sandbox/output\"");
    process.exit(1);
}

const inputDocxPath = path.resolve(inputDocxArg);
const outputDir = path.resolve(outputDirArg);
// --- Конец Настроек ---

async function main() {
    console.log(`[Convert Script] Начало конвертации файла: ${inputDocxPath}`);
    console.log(`[Convert Script] Выходная директория: ${outputDir}`);

    try {
        const outputMdPath = await convertDocxToMd(inputDocxPath, outputDir);
        console.log(`[Convert Script] Файл успешно сконвертирован: ${outputMdPath}`);
    } catch (error) {
        console.error(`[Convert Script] Ошибка во время конвертации:`, error);
        process.exit(1);
    }
}

main(); 