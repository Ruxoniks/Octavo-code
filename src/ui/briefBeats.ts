import { DEFAULT_VOICE } from './voices';

/**
 * Разбор брифа на реплики диалога.
 *
 * Формат простой и обратно совместимый:
 *
 *   [КУРСОР]
 *   Текст реплики.
 *
 *   ---
 *
 *   [ЛОГИКА]
 *   Следующая реплика.
 *
 * Разделитель `---` режет текст на реплики, строка `[ИМЯ]` задаёт голос
 * (если её нет — голос наследуется от предыдущей реплики). Если разделителей
 * в файле нет вообще, текст режется по заголовкам `##`, поэтому старые брифы
 * тоже превращаются в диалог, просто без имён.
 */
export interface Beat {
  speaker: string;
  markdown: string;
}

const SPEAKER_LINE = /^\[([^\]]{2,40})\]\s*$/;
const RULE_LINE = /^-{3,}\s*$/;
const HEADING_LINE = /^##\s+\S/;

function splitChunks(source: string): string[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const byRule: string[][] = [[]];
  const byHeading: string[][] = [[]];
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) inFence = !inFence;

    if (!inFence && RULE_LINE.test(line)) {
      byRule.push([]);
      continue;
    }

    if (!inFence && HEADING_LINE.test(line) && byHeading[byHeading.length - 1].length > 0) {
      byHeading.push([]);
    }

    byRule[byRule.length - 1].push(line);
    byHeading[byHeading.length - 1].push(line);
  }

  const chunks = byRule.length > 1 ? byRule : byHeading;
  return chunks.map((chunk) => chunk.join('\n').trim()).filter((chunk) => chunk.length > 0);
}

export function parseBeats(source: string): Beat[] {
  const beats: Beat[] = [];
  let speaker = DEFAULT_VOICE;

  for (const chunk of splitChunks(source)) {
    const lines = chunk.split('\n');
    const match = lines[0]?.match(SPEAKER_LINE);

    if (match) {
      speaker = match[1].trim();
      lines.shift();
    }

    const markdown = lines.join('\n').trim();
    if (markdown) beats.push({ speaker, markdown });
  }

  return beats;
}
