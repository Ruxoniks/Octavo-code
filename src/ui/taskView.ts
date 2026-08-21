import type { CheckResult, CheckRun, ResolvedTask } from '../core/types';
import { getClient, tasks } from '../core/registry';
import { clearDraft, getTaskProgress, isDone, markAttempt, markDone, saveDraft } from '../core/progress';
import { navigate } from '../core/router';
import { t } from '../core/i18n';
import { append, clear, el } from './dom';
import { parseBeats } from './briefBeats';
import { Dialogue } from './dialogue';
import { Tabs } from './tabs';
import { renderChecks } from './checks';
import { renderHints } from './hints';
import { createFilesPanel } from './filesPanel';
import { openAiPanel } from './aiPanel';
import { PreviewPane } from './preview';
import { activeCriteria, renderClientPanel, revisionActive } from './clientPanel';
import type { Runner, RunnerContext } from './runners';
import { createCodeRunner } from './runners/codeRunner';
import { createDndRunner } from './runners/dndRunner';
import { createReadRunner } from './runners/readRunner';
import { createTerminalRunner } from './runners/terminalRunner';

/**
 * Экран задания: слева диалог и вкладки, в центре инструмент решения,
 * справа песочница. Ничего не растёт вниз — вся высота поделена заранее,
 * скроллятся только внутренности.
 */
export function renderTaskView(task: ResolvedTask): HTMLElement {
  const id = task.manifest.id;
  const progress = getTaskProgress(id);
  const persona = task.manifest.client ? getClient(task.manifest.client) : undefined;

  let files: Record<string, string> = { ...task.files, ...(progress.draft ?? {}) };
  let lastRun: CheckRun | null = null;
  let revisionAnnounced = persona ? revisionActive(persona, progress.attempts) : false;

  const preview = new PreviewPane();
  const dialogue = new Dialogue(parseBeats(task.brief));

  const checksHost = el('div', {});
  const hintsHost = el('div', {});
  const filesHost = el('div', {});
  const clientHost = el('div', { class: 'client' });

  const context: RunnerContext = {
    task,
    getFiles: () => files,
    setFile: (name, content) => {
      files = { ...files, [name]: content };
      saveDraft(id, files);
    },
    requestPreview: () => {
      void preview.render(files, task.preview.entry);
    },
  };

  const runner = createRunner(task, context);

  const applyFiles = (incoming: Record<string, string>): void => {
    files = { ...files, ...incoming };
    saveDraft(id, files);
    runner.reload();
    context.requestPreview();
  };

  const tabs = new Tabs([
    { id: 'checks', label: t('tabs.checks'), body: el('div', {}, persona ? clientHost : null, checksHost) },
    { id: 'hints', label: t('tabs.hints'), body: hintsHost },
    { id: 'files', label: t('tabs.files'), body: filesHost },
  ]);

  const refreshClient = (): void => {
    if (!persona) return;
    renderClientPanel(clientHost, {
      persona,
      attempts: getTaskProgress(id).attempts,
      results: lastRun?.results ?? [],
    });
  };

  /** Правка заказчика приходит репликой в диалог — как настоящее сообщение. */
  const announceRevision = (): void => {
    if (!persona?.revision || revisionAnnounced) return;
    if (!revisionActive(persona, getTaskProgress(id).attempts)) return;
    revisionAnnounced = true;
    dialogue.addBeat({ speaker: 'ЗАКАЗЧИК', markdown: persona.revision.message });
  };

  const checkButton = el('button', {
    class: 'primary',
    text: persona ? t('client.submit') : t('task.check'),
  }) as HTMLButtonElement;

  const runCheck = async (): Promise<void> => {
    checkButton.disabled = true;
    checkButton.textContent = t('task.checking');
    markAttempt(id);

    await preview.render(files, task.preview.entry);

    const sandboxRun: CheckRun = task.checkSource.trim()
      ? await preview.runChecks(task.checkSource, task.preview.timeoutMs ?? 3000, task.preview.mascot)
      : { ok: true, results: [] };

    const local: CheckResult[] = runner.localChecks?.() ?? [];
    let results = [...sandboxRun.results, ...local];

    // Заказчик оценивает работу только по тем критериям, которые уже озвучил.
    if (persona) {
      const active = new Set(activeCriteria(persona, getTaskProgress(id).attempts).map((c) => c.id));
      results = results.filter((r) => active.has(r.id));
    }

    lastRun = {
      ok: !sandboxRun.error && results.length > 0 && results.every((r) => r.ok),
      results,
      error: sandboxRun.error,
    };

    renderChecks(checksHost, lastRun);
    tabs.select('checks');

    const failed = results.filter((r) => !r.ok).length;
    if (lastRun.ok) tabs.setBadge('checks', '✓', 'ok');
    else tabs.setBadge('checks', failed ? String(failed) : '!', 'fail');

    announceRevision();
    refreshClient();

    if (lastRun.ok) {
      markDone(id);
      renderFooter();
      if (task.preview.mascot && task.preview.mascot.mode !== 'off') preview.playMascot(task.preview.mascot);
    }

    checkButton.disabled = false;
    checkButton.textContent = persona ? t('client.submit') : t('task.check');
  };

  checkButton.addEventListener('click', () => void runCheck());

  const footer = el('div', { class: 'toolbar' });

  const renderFooter = (): void => {
    clear(footer);
    append(footer, [
      checkButton,
      el('button', { text: t('task.run'), on: { click: () => context.requestPreview() } }),
      // Итоговые задания главы человек пишет сам — там кнопки нейросети нет.
      task.manifest.allowAi === false
        ? null
        : el('button', {
            text: t('task.ai'),
            on: {
              click: () =>
                openAiPanel({
                  task,
                  getFiles: () => files,
                  applyFiles,
                  goal: task.manifest.ai?.goal,
                }),
            },
          }),
      el('button', {
        class: 'ghost',
        text: t('task.reset'),
        on: {
          click: () => {
            files = { ...task.files };
            clearDraft(id);
            runner.reload();
            context.requestPreview();
            lastRun = null;
            renderChecks(checksHost, null);
            tabs.setBadge('checks', null);
            refreshClient();
          },
        },
      }),
    ]);

    const next = nextTask(task);
    if (isDone(id) && next) {
      footer.appendChild(
        el('button', {
          class: 'primary',
          text: t('task.next'),
          on: { click: () => navigate(`/task/${next.manifest.id}`) },
        }),
      );
    }
  };

  renderFooter();

  const taskPane = el(
    'section',
    { class: 'pane pane--task' },
    el(
      'div',
      { class: 'task-head' },
      el('h1', { text: task.manifest.title }),
      el(
        'div',
        { class: 'task-head__meta' },
        isDone(id) ? el('span', { class: 'chip chip--done', text: t('map.done') }) : null,
        el('span', { class: 'chip', text: t('map.minutes', { n: task.manifest.estimateMin }) }),
        el('span', { class: 'chip', text: '◆'.repeat(task.manifest.difficulty) }),
        ...(task.manifest.tags ?? []).map((tag) => el('span', { class: 'chip', text: tag })),
      ),
    ),
    el('div', { class: 'mobile-warning', text: t('mobile.warning') }),
    dialogue.element,
    tabs.element,
  );

  const workPane = el(
    'section',
    { class: 'pane pane--editor' },
    el('header', { class: 'pane__header' }, t('task.editor')),
    runner.element,
    footer,
  );

  renderChecks(checksHost, null);
  renderHints(hintsHost, task, () => applyFiles(task.solution));
  filesHost.appendChild(
    createFilesPanel({
      projectName: task.manifest.id,
      getFiles: () => files,
      getActiveFile: () => task.editor.primary ?? task.editor.files[0],
      applyFiles,
    }),
  );
  announceRevision();
  refreshClient();
  void preview.render(files, task.preview.entry);

  return el('div', { class: 'workspace' }, taskPane, workPane, preview.element);
}

function createRunner(task: ResolvedTask, context: RunnerContext): Runner {
  switch (task.manifest.type) {
    case 'dnd':
      return createDndRunner(context);
    case 'read':
      return createReadRunner(context);
    case 'terminal':
      return createTerminalRunner(context);
    default:
      return createCodeRunner(context);
  }
}

export function nextTask(task: ResolvedTask): ResolvedTask | undefined {
  const index = tasks.findIndex((item) => item.manifest.id === task.manifest.id);
  return index >= 0 ? tasks[index + 1] : undefined;
}
