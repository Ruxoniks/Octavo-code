import { createShell, runCommand, shortPath, type ShellState } from '../../core/terminal/shell';
import { t } from '../../core/i18n';
import { clear, el, escapeHtml } from '../dom';
import type { Runner, RunnerContext } from './index';

/**
 * Терминал.
 *
 * Состояние сессии уезжает в песочницу внутри страницы — тем же способом,
 * что и собранная мышкой вёрстка в dnd-задании. Благодаря этому проверки
 * остаются обычным check.js: он читает JSON из #session и смотрит, что
 * ученик действительно сделал, а не что он «нажал».
 */
interface LogLine {
  kind: 'input' | 'output' | 'error' | 'note';
  text: string;
}

export function createTerminalRunner(context: RunnerContext): Runner {
  const config = context.task.manifest.terminal;
  if (!config) throw new Error('Задание типа terminal без блока terminal в манифесте');

  const entry = context.task.preview.entry;
  const pasteRequests = config.paste ?? [];

  const shellOptions = { home: config.home, cwd: config.cwd, files: config.files, git: config.git };
  let shell = createShell(shellOptions);
  let log: LogLine[] = [];

  const logHost = el('div', { class: 'terminal__log' });
  const prompt = el('span', { class: 'terminal__prompt' });
  const input = el('input', {
    class: 'terminal__input',
    type: 'text',
    autocomplete: 'off',
    spellcheck: false,
    attrs: { 'aria-label': t('terminal.title') },
  }) as HTMLInputElement;

  const pasteHost = el('div', { class: 'terminal__paste' });

  let previewTimer: number | undefined;

  const syncPreview = (immediate = false): void => {
    context.setFile(entry, renderSessionPage(shell, log));
    // Ввод в поле «вставь вывод» идёт по букве: пересобирать песочницу
    // на каждое нажатие незачем.
    window.clearTimeout(previewTimer);
    if (immediate) context.requestPreview();
    else previewTimer = window.setTimeout(() => context.requestPreview(), 250);
  };

  const renderLog = (): void => {
    clear(logHost);
    for (const line of log) {
      logHost.appendChild(el('div', { class: `terminal__line terminal__line--${line.kind}`, text: line.text }));
    }
    prompt.textContent = `${shortPath(shell, shell.cwd)} $`;
    logHost.scrollTop = logHost.scrollHeight;
  };

  const push = (line: LogLine): void => {
    log.push(line);
  };

  let historyIndex = -1;

  const submit = (command: string): void => {
    const trimmed = command.trim();
    push({ kind: 'input', text: `${shortPath(shell, shell.cwd)} $ ${trimmed}` });

    if (trimmed === 'clear') {
      log = [];
      shell = runCommand(shell, trimmed).state;
    } else if (trimmed) {
      const result = runCommand(shell, trimmed);
      shell = result.state;
      if (result.output) {
        for (const line of result.output.split('\n')) {
          push({ kind: result.isError ? 'error' : 'output', text: line });
        }
      }
    }

    historyIndex = -1;
    renderLog();
    syncPreview(true);
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const value = input.value;
      input.value = '';
      submit(value);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (!shell.history.length) return;
      event.preventDefault();
      if (historyIndex === -1) historyIndex = shell.history.length;
      historyIndex += event.key === 'ArrowUp' ? -1 : 1;
      historyIndex = Math.max(0, Math.min(shell.history.length, historyIndex));
      input.value = shell.history[historyIndex] ?? '';
    }
  });

  const renderPaste = (): void => {
    clear(pasteHost);
    if (!pasteRequests.length) return;

    pasteHost.appendChild(el('h3', { text: t('terminal.pasteTitle') }));

    for (const request of pasteRequests) {
      const field = el('input', {
        type: 'text',
        value: shell.pasted[request.command] ?? '',
        placeholder: t('terminal.pastePlaceholder'),
        on: {
          input: (event: Event) => {
            shell.pasted[request.command] = (event.target as HTMLInputElement).value.trim();
            syncPreview();
          },
        },
      });

      pasteHost.appendChild(
        el(
          'div',
          { class: 'paste-item' },
          el('div', { class: 'paste-item__label', html: `${escapeHtml(request.label)} <code>${escapeHtml(request.command)}</code>` }),
          field,
          request.hint ? el('div', { class: 'paste-item__hint', text: request.hint }) : null,
        ),
      );
    }
  };

  const element = el(
    'div',
    { class: 'terminal' },
    logHost,
    el(
      'form',
      {
        class: 'terminal__form',
        on: {
          submit: (event: Event) => {
            event.preventDefault();
            const value = input.value;
            input.value = '';
            submit(value);
          },
        },
      },
      prompt,
      input,
    ),
    pasteHost,
  );

  const reset = (): void => {
    shell = createShell(shellOptions);
    log = [{ kind: 'note', text: t('terminal.hint') }];
    renderLog();
    renderPaste();
    syncPreview(true);
  };

  reset();
  element.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('input, button')) return;
    input.focus();
  });

  return {
    element,
    reload: () => reset(),
  };
}

/**
 * Страница-снимок сессии: сверху читаемый лог, внизу состояние в JSON.
 * Проверкам нужен именно JSON, человеку — лог.
 */
function renderSessionPage(shell: ShellState, log: LogLine[]): string {
  const lines = log
    .map((line) => `<div class="line line--${line.kind}">${escapeHtml(line.text)}</div>`)
    .join('\n');

  const session = JSON.stringify({
    cwd: shell.cwd,
    home: shell.home,
    fs: shell.fs,
    git: shell.git,
    pasted: shell.pasted,
    history: shell.history,
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Сессия терминала</title>
    <style>
      body { margin: 0; padding: 16px; background: #3d2837; color: #fff9e4;
             font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13px; line-height: 1.5; }
      .line { white-space: pre-wrap; word-break: break-word; }
      .line--input { color: #f0d9a8; }
      .line--error { color: #f0a58c; }
      .line--note { color: rgba(255, 249, 228, 0.55); }
    </style>
  </head>
  <body>
${lines}
    <script id="session" type="application/json">${session}</script>
  </body>
</html>`;
}
