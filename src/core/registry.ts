import type {
  ChapterDef,
  ClientPersona,
  MascotConfig,
  GlobalConfig,
  PreviewConfig,
  ResolvedTask,
  TaskManifest,
} from './types';
import { chapterSchema, clientSchema, globalConfigSchema, taskManifestSchema } from './schema';

/**
 * Реестр контента.
 *
 * Всё содержимое папки content/ подтягивается на этапе сборки через
 * import.meta.glob, поэтому добавление задания = добавление папки,
 * без единой правки кода движка.
 */

const rawGlobal = import.meta.glob('/content/global.json', { eager: true, import: 'default' });
const rawChapters = import.meta.glob('/content/chapters.json', { eager: true, import: 'default' });
const rawManifests = import.meta.glob('/content/tasks/*/manifest.json', { eager: true, import: 'default' });
const rawBriefs = import.meta.glob('/content/tasks/*/brief.ru.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const rawChecks = import.meta.glob('/content/tasks/*/check.js', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const rawFiles = import.meta.glob('/content/tasks/*/files/**/*.*', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const rawClients = import.meta.glob('/content/clients/*/client.json', { eager: true, import: 'default' });

function first<T>(map: Record<string, unknown>): T {
  const values = Object.values(map);
  if (!values.length) throw new Error('Не найден обязательный файл контента');
  return values[0] as T;
}

export const globalConfig: GlobalConfig = globalConfigSchema.parse(first(rawGlobal)) as GlobalConfig;

export const chapters: ChapterDef[] = (first<unknown[]>(rawChapters) as unknown[])
  .map((c) => chapterSchema.parse(c) as ChapterDef)
  .sort((a, b) => a.order - b.order);

export const clients: Record<string, ClientPersona> = Object.fromEntries(
  Object.values(rawClients).map((raw) => {
    const parsed = clientSchema.parse(raw) as ClientPersona;
    return [parsed.id, parsed];
  }),
);

/** /content/tasks/01-html-tags/manifest.json → 01-html-tags */
function folderOf(path: string): string {
  const m = path.match(/\/content\/tasks\/([^/]+)\//);
  if (!m) throw new Error(`Неожиданный путь контента: ${path}`);
  return m[1];
}

function collectFiles(folder: string, kind: 'start' | 'solution'): Record<string, string> {
  const prefix = `/content/tasks/${folder}/files/${kind}/`;
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(rawFiles)) {
    if (path.startsWith(prefix)) out[path.slice(prefix.length)] = content as string;
  }
  return out;
}

function mergeTask(manifest: TaskManifest, folder: string): ResolvedTask {
  const files = collectFiles(folder, 'start');
  const solution = collectFiles(folder, 'solution');

  const editor = {
    ...globalConfig.editor,
    ...manifest.editor,
    files: manifest.editor?.files ?? Object.keys(files),
  };
  editor.primary = editor.primary ?? editor.files[0];

  const globalMascot: MascotConfig = globalConfig.preview.mascot ?? { mode: 'off' };
  const preview: PreviewConfig = {
    ...globalConfig.preview,
    ...manifest.preview,
    entry: manifest.preview?.entry ?? globalConfig.preview.entry,
    mascot: {
      ...globalMascot,
      ...manifest.preview?.mascot,
      mode: manifest.preview?.mascot?.mode ?? globalMascot.mode,
      speed: manifest.preview?.mascot?.speed ?? globalConfig.mascot.speed,
    },
  };

  const hintsConfig = {
    maxLevels: manifest.hintsConfig?.maxLevels ?? globalConfig.hints.maxLevels ?? 3,
    allowSolution: manifest.hintsConfig?.allowSolution ?? globalConfig.hints.allowSolution ?? true,
  };

  const briefKey = `/content/tasks/${folder}/brief.ru.md`;
  const checkKey = `/content/tasks/${folder}/check.js`;

  return {
    manifest,
    editor,
    preview,
    hints: (manifest.hints ?? []).slice().sort((a, b) => a.level - b.level),
    hintsConfig,
    files,
    solution,
    brief: (rawBriefs[briefKey] as string) ?? '',
    checkSource: (rawChecks[checkKey] as string) ?? '',
  };
}

function buildTasks(): ResolvedTask[] {
  const list: ResolvedTask[] = [];
  for (const [path, raw] of Object.entries(rawManifests)) {
    const parsed = taskManifestSchema.safeParse(raw);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Некорректный манифест ${path} → ${details}`);
    }
    list.push(mergeTask(parsed.data as TaskManifest, folderOf(path)));
  }
  return list.sort((a, b) => {
    const ca = chapters.findIndex((c) => c.id === a.manifest.chapter);
    const cb = chapters.findIndex((c) => c.id === b.manifest.chapter);
    return ca === cb ? a.manifest.order - b.manifest.order : ca - cb;
  });
}

export const tasks: ResolvedTask[] = buildTasks();

const byId = new Map(tasks.map((t) => [t.manifest.id, t]));

export function getTask(id: string): ResolvedTask | undefined {
  return byId.get(id);
}

export function tasksOfChapter(chapterId: string): ResolvedTask[] {
  return tasks.filter((t) => t.manifest.chapter === chapterId);
}

export function getClient(id: string): ClientPersona | undefined {
  return clients[id];
}
