import type { ResolvedTask } from './types';

/**
 * Модуль работы с нейросетью.
 *
 * Главный сценарий — копипаст: игра собирает промпт, ученик несёт его в любой
 * чат, возвращает ответ и разбирает, что именно нейросеть сделала с его кодом.
 * Смысл в том, чтобы научить ставить задачу и проверять результат, а не в том,
 * чтобы спрятать нейросеть за одной кнопкой.
 *
 * Опционально можно подключить собственный ключ Anthropic (BYOK) — тогда
 * запрос уходит прямо из браузера. Ключ хранится только в localStorage
 * пользователя, никакого общего ключа и никакого прокси в проекте нет.
 */

export const DEFAULT_MODEL = 'claude-opus-5';

export interface PromptContext {
  task: ResolvedTask;
  files: Record<string, string>;
  /** Чего именно ученик хочет от нейросети (для type=ai берётся из манифеста). */
  goal?: string;
}

function fenceFor(filename: string): string {
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.js')) return 'js';
  return '';
}

export function buildPrompt({ task, files, goal }: PromptContext): string {
  const manifest = task.manifest;
  const requirements = manifest.ai?.requirements ?? [];
  const target = manifest.ai?.targetFiles ?? Object.keys(files);

  const lines: string[] = [
    'Ты помогаешь мне с учебным проектом на чистом HTML, CSS и JavaScript.',
    'Никаких фреймворков, сборщиков и внешних библиотек — только эти три технологии.',
    '',
    `ЗАДАЧА: ${goal ?? manifest.ai?.goal ?? manifest.summary}`,
  ];

  if (requirements.length) {
    lines.push('', 'ТРЕБОВАНИЯ:');
    requirements.forEach((r) => lines.push(`- ${r}`));
  }

  lines.push('', 'МОИ ФАЙЛЫ:');
  for (const name of Object.keys(files)) {
    lines.push('', `Файл ${name}:`, '```' + fenceFor(name), files[name], '```');
  }

  lines.push(
    '',
    'КАК ОТВЕТИТЬ:',
    `1. Верни полное содержимое каждого изменённого файла (${target.join(', ')}).`,
    '2. Перед каждым блоком кода напиши имя файла отдельной строкой.',
    '3. Не сокращай код комментариями вида «остальное без изменений».',
    '4. В конце коротко объясни, что именно ты изменил и зачем.',
  );

  return lines.join('\n');
}

export interface ParsedBlock {
  file: string;
  content: string;
}

const FENCE = /```([a-zA-Z0-9]*)\s*\n([\s\S]*?)```/g;

/**
 * Достаёт из ответа нейросети блоки кода и сопоставляет их с файлами проекта.
 * Модели оформляют ответ по-разному, поэтому имя файла ищем и в информационной
 * строке блока, и в двух-трёх строках перед ним, и по языку блока.
 */
export function parseAiResponse(response: string, knownFiles: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const seen = new Set<string>();

  FENCE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FENCE.exec(response)) !== null) {
    const info = match[1] ?? '';
    const content = match[2].replace(/\s+$/, '');
    const before = response.slice(Math.max(0, match.index - 220), match.index);

    const file =
      findFilename(info, knownFiles) ??
      findFilename(before, knownFiles) ??
      guessByLanguage(info, knownFiles, seen);

    if (!file || seen.has(file)) continue;
    seen.add(file);
    blocks.push({ file, content });
  }

  return blocks;
}

function findFilename(text: string, knownFiles: string[]): string | undefined {
  const normalized = text.toLowerCase();
  // Ищем самое последнее упоминание — ближе к блоку кода.
  let best: { file: string; index: number } | undefined;
  for (const file of knownFiles) {
    const index = normalized.lastIndexOf(file.toLowerCase());
    if (index !== -1 && (!best || index > best.index)) best = { file, index };
  }
  return best?.file;
}

function guessByLanguage(info: string, knownFiles: string[], seen: Set<string>): string | undefined {
  const lang = info.toLowerCase();
  const extension = lang === 'javascript' || lang === 'js' ? '.js' : lang === 'css' ? '.css' : lang === 'html' ? '.html' : '';
  if (!extension) return undefined;
  const candidates = knownFiles.filter((f) => f.endsWith(extension) && !seen.has(f));
  return candidates.length === 1 ? candidates[0] : undefined;
}

/**
 * Необязательный прямой вызов Claude с ключом самого пользователя.
 * SDK подгружается динамически, чтобы он не попадал в основной бандл
 * тех, кто пользуется обычным копипастом.
 */
export async function askClaude(apiKey: string, prompt: string, model = DEFAULT_MODEL): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();
}
