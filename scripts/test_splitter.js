import fs from 'fs/promises';
import path from 'path';
import { splitMarkdown } from '../src/utils/splitMarkdown.js';

// --- Настройки ---
const inputFileRelativePath = 'pandoc sandbox/output/processed_test_output_raw_llm.md';
// const outputJsonPath = 'output/test_split_chunks.json'; // Больше не используется
const outputChunksDir = 'output/chunks'; // Директория для сохранения .md файлов чанков
const moduleId = 'SCPL.Core.AgentHelper'; // Пример ID модуля
const splitLevel = 6; // Уровень заголовка для первичного разделения (H2)
const maxChunkLength = 4000; // Максимальная длина чанка в символах
// ---------------

async function main() {
  const inputFilePath = path.resolve(inputFileRelativePath);
  const sourceFileName = path.basename(inputFilePath);
  const outputDirPath = path.resolve(outputChunksDir);

  console.log(`Читаем файл: ${inputFilePath}`);
  let markdownContent;
  try {
    markdownContent = await fs.readFile(inputFilePath, 'utf-8');
  } catch (error) {
    console.error(`Ошибка чтения файла ${inputFilePath}:`, error);
    process.exit(1);
  }

  console.log(`Разделяем Markdown по заголовкам H${splitLevel} с макс. длиной ${maxChunkLength}...`);
  const chunks = await splitMarkdown(
    markdownContent,
    sourceFileName,
    moduleId,
    splitLevel,
    maxChunkLength
  );

  console.log(`Получено чанков: ${chunks.length}`);

  // Создаем директорию для вывода чанков, если ее нет
  await fs.mkdir(outputDirPath, { recursive: true });

  console.log(`Сохраняем чанки в директорию: ${outputDirPath}`);
  let savedCount = 0;
  const savePromises = chunks.map(async (chunk) => {
    const chunkFileName = `chunk_${chunk.chunk_index}_${chunk.sub_chunk_index}.md`;
    const chunkFilePath = path.join(outputDirPath, chunkFileName);
    try {
      await fs.writeFile(chunkFilePath, chunk.text);
      savedCount++;
    } catch (error) {
      console.error(`Ошибка записи файла ${chunkFilePath}:`, error);
    }
  });

  await Promise.all(savePromises);

  if (savedCount === chunks.length) {
      console.log(`Все ${savedCount} чанков успешно сохранены.`);
  } else {
      console.warn(`Сохранено ${savedCount} из ${chunks.length} чанков.`);
  }
  console.log('Готово!');
  /* // Больше не используется
  console.log(`Сохраняем результат в: ${outputFilePath}`);
  try {
    await fs.writeFile(outputFilePath, JSON.stringify(chunks, null, 2));
    console.log('Готово!');
  } catch (error) {
    console.error(`Ошибка записи файла ${outputFilePath}:`, error);
    process.exit(1);
  }
  */
}

main().catch(console.error); 