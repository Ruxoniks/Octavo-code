/**
 * Архив промптов.
 *
 * Хороший запрос к нейросети — такой же навык, как чистая вёрстка, и учиться
 * ему проще на готовых примерах. Каждый промпт лежит отдельным markdown-файлом
 * в content/prompts, поэтому пополнять архив можно, ничего не зная про код.
 */

export interface Prompt {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  /** Текст, который копируется в чат. */
  body: string;
  /** Откуда промпт взят, если это не наш собственный. */
  source?: string;
}

const rawPrompts = import.meta.glob('/content/prompts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

/**
 * Формат файла:
 *
 *   ---
 *   title: Объясни этот код построчно
 *   summary: Когда код работает, но непонятно почему.
 *   tags: чтение кода, отладка
 *   ---
 *
 *   Текст промпта…
 */
export function parsePrompt(id: string, source: string): Prompt {
  const text = source.replace(/\r\n/g, '\n');
  const match = text.match(FRONTMATTER);
  const meta: Record<string, string> = {};

  if (match) {
    for (const line of match[1].split('\n')) {
      const separator = line.indexOf(':');
      if (separator === -1) continue;
      meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
  }

  return {
    id,
    title: meta.title || id,
    summary: meta.summary || '',
    tags: meta.tags
      ? meta.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    source: meta.source || undefined,
    body: text.slice(match ? match[0].length : 0).trim(),
  };
}

function idOf(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.md$/, '');
}

export const prompts: Prompt[] = Object.entries(rawPrompts)
  .map(([path, source]) => parsePrompt(idOf(path), source as string))
  .sort((a, b) => a.id.localeCompare(b.id, 'ru'));

export function promptTags(): string[] {
  const all = new Set<string>();
  for (const prompt of prompts) prompt.tags.forEach((tag) => all.add(tag));
  return [...all].sort((a, b) => a.localeCompare(b, 'ru'));
}

/** Поиск по названию, описанию и тексту — без индексов, промптов немного. */
export function searchPrompts(query: string, tag?: string): Prompt[] {
  const needle = query.trim().toLowerCase();
  return prompts.filter((prompt) => {
    if (tag && !prompt.tags.includes(tag)) return false;
    if (!needle) return true;
    return (
      prompt.title.toLowerCase().includes(needle) ||
      prompt.summary.toLowerCase().includes(needle) ||
      prompt.body.toLowerCase().includes(needle)
    );
  });
}
