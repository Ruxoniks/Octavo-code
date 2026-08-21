import { strToU8, zipSync } from 'fflate';

/**
 * Работа с файлами: скачать проект себе, отредактировать его чем угодно
 * (редактором, нейросетью) и вернуть обратно перетаскиванием.
 * Это отдельный учебный навык, а не служебная кнопка.
 */

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(filename, blob);
}

export function downloadZip(projectName: string, files: Record<string, string>): void {
  const payload: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    payload[name] = strToU8(content);
  }
  const zipped = zipSync(payload, { level: 6 });
  const buffer = new ArrayBuffer(zipped.byteLength);
  new Uint8Array(buffer).set(zipped);
  triggerDownload(`${projectName}.zip`, new Blob([buffer], { type: 'application/zip' }));
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const TEXT_EXTENSIONS = /\.(html?|css|js|mjs|json|txt|md|svg)$/i;

/** Читает файлы и папки, брошенные в окно. */
export async function readDrop(dataTransfer: DataTransfer): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const entries: FileSystemEntry[] = [];

  for (const item of Array.from(dataTransfer.items ?? [])) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  if (entries.length) {
    await Promise.all(entries.map((entry) => walkEntry(entry, out)));
    return out;
  }

  for (const file of Array.from(dataTransfer.files ?? [])) {
    if (TEXT_EXTENSIONS.test(file.name)) out[file.name] = await file.text();
  }
  return out;
}

async function walkEntry(entry: FileSystemEntry, out: Record<string, string>): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    if (TEXT_EXTENSIONS.test(file.name)) out[file.name] = await file.text();
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    await Promise.all(children.map((child) => walkEntry(child, out)));
  }
}

export type DiffLineKind = 'ctx' | 'add' | 'del';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
}

/** Построчный diff на основе наибольшей общей подпоследовательности. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.replace(/\r\n/g, '\n').split('\n');
  const b = after.replace(/\r\n/g, '\n').split('\n');

  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ kind: 'ctx', text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ kind: 'del', text: a[i] });
      i++;
    } else {
      result.push({ kind: 'add', text: b[j] });
      j++;
    }
  }
  while (i < a.length) result.push({ kind: 'del', text: a[i++] });
  while (j < b.length) result.push({ kind: 'add', text: b[j++] });

  return result;
}

export function hasChanges(diff: DiffLine[]): boolean {
  return diff.some((line) => line.kind !== 'ctx');
}

/** Сворачивает длинные неизменённые куски, чтобы дифф читался. */
export function collapseDiff(diff: DiffLine[], context = 2): DiffLine[] {
  const keep = new Set<number>();
  diff.forEach((line, index) => {
    if (line.kind === 'ctx') return;
    for (let i = index - context; i <= index + context; i++) keep.add(i);
  });

  const out: DiffLine[] = [];
  let skipping = false;
  diff.forEach((line, index) => {
    if (keep.has(index)) {
      out.push(line);
      skipping = false;
    } else if (!skipping) {
      out.push({ kind: 'ctx', text: '…' });
      skipping = true;
    }
  });
  return out;
}
