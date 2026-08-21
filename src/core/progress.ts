import type { ProgressState, TaskProgress } from './types';

/**
 * Прогресс живёт в localStorage — никакого сервера и никаких аккаунтов.
 * Чтобы прогресс всё же можно было перенести, есть экспорт и импорт JSON:
 * заодно это первое живое знакомство ученика с форматом JSON.
 */

const STORAGE_KEY = 'octavo-code:progress:v1';

const emptyState = (): ProgressState => ({
  version: 1,
  tasks: {},
  settings: {},
});

const emptyTask = (): TaskProgress => ({
  status: 'todo',
  attempts: 0,
  hintsUsed: 0,
  solutionShown: false,
});

let state: ProgressState = load();
const listeners = new Set<(s: ProgressState) => void>();

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1 || typeof parsed.tasks !== 'object') return emptyState();
    return { ...emptyState(), ...parsed, settings: { ...emptyState().settings, ...parsed.settings } };
  } catch {
    return emptyState();
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Приватный режим или переполненное хранилище — играть всё равно можно.
  }
  listeners.forEach((fn) => fn(state));
}

export function getState(): ProgressState {
  return state;
}

export function subscribe(fn: (s: ProgressState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getTaskProgress(taskId: string): TaskProgress {
  return state.tasks[taskId] ?? emptyTask();
}

export function updateTask(taskId: string, patch: Partial<TaskProgress>): TaskProgress {
  const next = { ...getTaskProgress(taskId), ...patch };
  state.tasks[taskId] = next;
  persist();
  return next;
}

export function markAttempt(taskId: string): void {
  const current = getTaskProgress(taskId);
  updateTask(taskId, { attempts: current.attempts + 1 });
}

export function markDone(taskId: string): void {
  const current = getTaskProgress(taskId);
  if (current.status === 'done') return;
  updateTask(taskId, { status: 'done', completedAt: new Date().toISOString() });
}

export function saveDraft(taskId: string, draft: Record<string, string>): void {
  updateTask(taskId, { draft });
}

export function clearDraft(taskId: string): void {
  const current = getTaskProgress(taskId);
  const { draft: _drop, ...rest } = current;
  void _drop;
  state.tasks[taskId] = rest as TaskProgress;
  persist();
}

export function isDone(taskId: string): boolean {
  return getTaskProgress(taskId).status === 'done';
}

export function setSetting<K extends keyof ProgressState['settings']>(
  key: K,
  value: ProgressState['settings'][K],
): void {
  state.settings[key] = value;
  persist();
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): void {
  const parsed = JSON.parse(json) as ProgressState;
  if (parsed.version !== 1 || typeof parsed.tasks !== 'object') {
    throw new Error('Это не файл прогресса Octavo-code');
  }
  state = { ...emptyState(), ...parsed, settings: { ...emptyState().settings, ...parsed.settings } };
  persist();
}

export function resetProgress(): void {
  state = emptyState();
  persist();
}
