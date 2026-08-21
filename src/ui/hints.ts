import type { ResolvedTask } from '../core/types';
import { getTaskProgress, updateTask } from '../core/progress';
import { t } from '../core/i18n';
import { el, clear } from './dom';

/**
 * Подсказки открываются по одной. Эталон доступен, но задание в этом случае
 * помечается как пройденное с решением — честно и без блокировок.
 */
export function renderHints(
  container: HTMLElement,
  task: ResolvedTask,
  onShowSolution: () => void,
): void {
  clear(container);
  const progress = getTaskProgress(task.manifest.id);
  const maxLevels = Math.min(task.hintsConfig.maxLevels, task.hints.length);

  container.appendChild(el('h3', { text: t('hints.title') }));

  if (!task.hints.length) {
    container.appendChild(el('p', { class: 'muted tiny', text: t('hints.none') }));
    return;
  }

  const shown = Math.min(progress.hintsUsed, maxLevels);
  for (let i = 0; i < shown; i++) {
    container.appendChild(el('div', { class: 'hint', text: task.hints[i].text }));
  }

  const actions = el('div', { class: 'hints__actions' });

  if (shown < maxLevels) {
    actions.appendChild(
      el('button', {
        text: shown === 0 ? t('hints.show') : t('hints.next'),
        on: {
          click: () => {
            updateTask(task.manifest.id, { hintsUsed: shown + 1 });
            renderHints(container, task, onShowSolution);
          },
        },
      }),
    );
  }

  if (task.hintsConfig.allowSolution && Object.keys(task.solution).length) {
    actions.appendChild(
      el('button', {
        class: 'ghost',
        text: t('hints.solution'),
        on: {
          click: () => {
            if (!confirm(t('hints.solutionConfirm'))) return;
            updateTask(task.manifest.id, { solutionShown: true });
            onShowSolution();
            renderHints(container, task, onShowSolution);
          },
        },
      }),
    );
  }

  container.appendChild(actions);
}
