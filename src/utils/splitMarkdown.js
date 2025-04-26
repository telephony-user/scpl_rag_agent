import { remark } from 'remark';
import remarkParse from 'remark-parse';
import { toMarkdown } from 'mdast-util-to-markdown';
import { visit } from 'unist-util-visit';

const MIN_CHUNK_LENGTH = 2000; // Define min length constant
const MAX_CHUNK_LENGTH = 4000; // Define max length constant

/**
 * Извлекает текстовое содержимое из узла mdast.
 * @param {object} node - Узел mdast.
 * @returns {string} - Текстовое содержимое.
 */
function getNodeText(node) {
  let text = '';
  visit(node, ['text', 'inlineCode'], (child) => {
    text += child.value;
  });
  return text;
}

/**
 * Генерирует Markdown представление иерархии заголовков.
 * @param {Array<string>} headerHierarchy - Массив заголовков.
 * @returns {string} - Строка Markdown с заголовками.
 */
function generateHeaderMarkdown(headerHierarchy) {
    return headerHierarchy
        .map((title, index) => `${'#'.repeat(index + 1)} ${title}`)
        .join('\n\n') + (headerHierarchy.length > 0 ? '\n\n' : '');
}

/**
 * Разделяет Markdown-контент на чанки по заголовкам (H1-H6) с учетом мин/макс длины.
 * @param {string} markdownContent - Содержимое Markdown файла.
 * @param {string} sourceFileName - Имя исходного файла.
 * @param {string} moduleId - ID модуля.
 * @param {number} [maxChunkLength=MAX_CHUNK_LENGTH] - Максимальная длина чанка.
 * @param {number} [minChunkLength=MIN_CHUNK_LENGTH] - Минимальная длина чанка.
 * @returns {Array<object>} - Массив объектов итоговых чанков.
 */
async function splitMarkdown(markdownContent, sourceFileName, moduleId, maxChunkLength = MAX_CHUNK_LENGTH, minChunkLength = MIN_CHUNK_LENGTH) {
  const processor = remark().use(remarkParse);
  const tree = processor.parse(markdownContent);

  let preliminaryChunks = [];
  let currentChunkNodes = [];
  let headerHierarchy = [];
  let chunkIndex = 0;

  // Этап 1: Первичное разделение по H1-H6 и вторичное по макс. длине (MAX_CHUNK_LENGTH)
  visit(tree, (node, index, parent) => {
    let isSplitPoint = false;
    if (node.type === 'heading') {
      const currentDepth = node.depth;
      headerHierarchy = headerHierarchy.slice(0, currentDepth - 1);
      headerHierarchy.push(getNodeText(node));
      if (currentDepth >= 1 && currentDepth <= 6) {
          isSplitPoint = true;
      }
    }

    if (isSplitPoint && currentChunkNodes.length > 0) {
      const primaryChunkTree = { type: 'root', children: currentChunkNodes };
      processAndAddPreliminaryChunks(
        primaryChunkTree, sourceFileName, moduleId, headerHierarchy.slice(0,-1),
        chunkIndex++, maxChunkLength, preliminaryChunks // Используем внешний maxChunkLength
      );
      currentChunkNodes = [];
    }

    if (parent) {
        if (!(isSplitPoint && currentChunkNodes.length === 0)) {
             currentChunkNodes.push(node);
        }
    }
  });

  if (currentChunkNodes.length > 0) {
    const primaryChunkTree = { type: 'root', children: currentChunkNodes };
    processAndAddPreliminaryChunks(
        primaryChunkTree, sourceFileName, moduleId, headerHierarchy,
        chunkIndex++, maxChunkLength, preliminaryChunks // Используем внешний maxChunkLength
    );
  }

  // Этап 2: Пост-обработка - Слияние коротких чанков для соблюдения мин. длины (minChunkLength)
  const finalChunks = [];
  let i = 0;
  while (i < preliminaryChunks.length) {
    let currentChunk = { ...preliminaryChunks[i] }; // Копируем чанк
    let currentHeaderMarkdown = generateHeaderMarkdown(currentChunk.header_hierarchy);
    let currentMergedTextWithHeaders = currentHeaderMarkdown + currentChunk.original_chunk_text;

    // Пытаемся слить со следующим, если текущий чанк слишком короткий
    while (currentMergedTextWithHeaders.length < minChunkLength && (i + 1) < preliminaryChunks.length) {
      const nextChunk = preliminaryChunks[i + 1];

      // Сливаем только если иерархия заголовков совпадает
      if (JSON.stringify(currentChunk.header_hierarchy) === JSON.stringify(nextChunk.header_hierarchy)) {
        const mergedOriginalText = currentChunk.original_chunk_text + '\n\n' + nextChunk.original_chunk_text;
        // Пересчитываем общую длину с заголовками текущего чанка
        const potentialMergedTotalLength = currentHeaderMarkdown.length + mergedOriginalText.length;

        if (potentialMergedTotalLength <= maxChunkLength) {
          // Выполняем слияние
          currentChunk.original_chunk_text = mergedOriginalText;
          currentMergedTextWithHeaders = currentHeaderMarkdown + currentChunk.original_chunk_text; // Обновляем для проверки длины
          // Обновляем sub_chunk_index для отражения слияния (опционально, можно просто оставить как у первого)
          currentChunk.sub_chunk_index = `${currentChunk.sub_chunk_index}-${nextChunk.sub_chunk_index}`;
          i++; // Увеличиваем индекс, чтобы пропустить следующий чанк, т.к. он слит
        } else {
          // Слияние превысит макс. длину, останавливаем попытки слияния для currentChunk
          break;
        }
      } else {
        // Иерархии заголовков не совпадают, не можем слить
        break;
      }
    }

    // Добавляем итоговый (возможно, слитый) чанк в результат
    // Финальный текст чанка = заголовки + (возможно, слитый) original_chunk_text
    currentChunk.text = currentHeaderMarkdown + currentChunk.original_chunk_text;
    finalChunks.push(currentChunk);
    i++; // Переходим к следующему неслтитому чанку
  }

  // Этап 3: Финальные проверки и предупреждения
  finalChunks.forEach((chunk, idx) => {
    if (chunk.text.length < minChunkLength) {
      console.warn(`[Splitter Warn] Final chunk ${idx} (Module: ${moduleId}, File: ${sourceFileName}, Original Index: ${chunk.chunk_index}-${chunk.sub_chunk_index}) is smaller than min length (${chunk.text.length} < ${minChunkLength}).`);
    }
    if (chunk.text.length > maxChunkLength) {
       console.warn(`[Splitter Warn] Final chunk ${idx} (Module: ${moduleId}, File: ${sourceFileName}, Original Index: ${chunk.chunk_index}-${chunk.sub_chunk_index}) exceeds max length (${chunk.text.length} > ${maxChunkLength}) possibly due to large paragraph.`);
    }
  });

  return finalChunks;
}

/**
 * Вспомогательная функция: Обрабатывает первичное дерево, выполняет вторичное разделение
 * по макс. длине параграфами и добавляет результат в preliminaryChunks.
 * Не выполняет слияние по мин. длине.
 */
function processAndAddPreliminaryChunks(primaryChunkTree, sourceFileName, moduleId, headerHierarchy, chunkIndex, maxChunkLength, preliminaryChunks) {
  const originalText = toMarkdown(primaryChunkTree).trim();
  if (!originalText) return;

  const headerMarkdown = generateHeaderMarkdown(headerHierarchy);
  const combinedTextLength = headerMarkdown.length + originalText.length;

  if (combinedTextLength <= maxChunkLength) {
    // Первичный чанк уже в пределах макс. длины
    preliminaryChunks.push({
      text: headerMarkdown + originalText, // Полный текст для будущей проверки minLength
      source_file_name: sourceFileName,
      module_id: moduleId,
      header_hierarchy: headerHierarchy,
      chunk_index: chunkIndex,
      sub_chunk_index: 0,
      original_chunk_text: originalText, // Текст без заголовков для слияния
    });
  } else {
    // Первичный чанк слишком длинный, делим по параграфам
    const paragraphs = originalText.split(/\n\n+/);
    let currentSubChunkContent = '';
    let subChunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      const paragraphWithHeadersLength = headerMarkdown.length + trimmedParagraph.length;
      const potentialNextContent = currentSubChunkContent + (currentSubChunkContent ? '\n\n' : '') + trimmedParagraph;
      const potentialTotalLength = headerMarkdown.length + potentialNextContent.length;

      // Если отдельный параграф уже превышает лимит
      if (!currentSubChunkContent && paragraphWithHeadersLength > maxChunkLength) {
        console.warn(`[Splitter Warn] Paragraph in chunk ${chunkIndex}-${subChunkIndex} (module ${moduleId}) with headers exceeds max length (${paragraphWithHeadersLength} > ${maxChunkLength}). Keeping paragraph intact.`);
        preliminaryChunks.push({
          text: headerMarkdown + trimmedParagraph,
          source_file_name: sourceFileName,
          module_id: moduleId,
          header_hierarchy: headerHierarchy,
          chunk_index: chunkIndex,
          sub_chunk_index: subChunkIndex++,
          original_chunk_text: trimmedParagraph,
        });
        currentSubChunkContent = '';
        continue;
      }

      // Если добавление параграфа превысит лимит
      if (potentialTotalLength > maxChunkLength) {
        if (currentSubChunkContent) { // Завершаем текущий под-чанк, если он не пуст
          preliminaryChunks.push({
            text: headerMarkdown + currentSubChunkContent,
            source_file_name: sourceFileName,
            module_id: moduleId,
            header_hierarchy: headerHierarchy,
            chunk_index: chunkIndex,
            sub_chunk_index: subChunkIndex++,
            original_chunk_text: currentSubChunkContent,
          });
          currentSubChunkContent = trimmedParagraph; // Начинаем новый
        } else {
          // Сюда не должны попасть из-за проверки выше, но на всякий случай
          console.warn(`[Splitter Logic Error] Trying to add paragraph that exceeds max length to empty chunk.`);
          preliminaryChunks.push({
             text: headerMarkdown + trimmedParagraph,
             source_file_name: sourceFileName, module_id: moduleId, header_hierarchy: headerHierarchy,
             chunk_index: chunkIndex, sub_chunk_index: subChunkIndex++, original_chunk_text: trimmedParagraph,
          });
           currentSubChunkContent = '';
        }
      } else {
        // Добавляем параграф к текущему под-чанку
        currentSubChunkContent = potentialNextContent;
      }
    } // Конец цикла по параграфам

    // Добавляем последний накопленный под-чанк
    if (currentSubChunkContent) {
      preliminaryChunks.push({
        text: headerMarkdown + currentSubChunkContent,
        source_file_name: sourceFileName,
        module_id: moduleId,
        header_hierarchy: headerHierarchy,
        chunk_index: chunkIndex,
        sub_chunk_index: subChunkIndex++,
        original_chunk_text: currentSubChunkContent,
      });
    }
  }
}

export { splitMarkdown }; 