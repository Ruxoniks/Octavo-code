import type { CheckRun } from '../core/types';
import { t } from '../core/i18n';
import { el, clear } from './dom';

/** Панель результатов проверки: каждая строка объясняет, что именно не сошлось. */
export function renderChecks(container: HTMLElement, run: CheckRun | null): void {
  clear(container);

  if (!run) {
    container.appendChild(el('p', { class: 'muted tiny', text: t('task.emptyChecks') }));
    return;
  }

  if (run.error) {
    container.appendChild(el('div', { class: 'verdict verdict--fail', text: run.error }));
  } else {
    container.appendChild(
      el('div', {
        class: `verdict verdict--${run.ok ? 'ok' : 'fail'}`,
        text: run.ok ? t('task.passed') : t('task.failed'),
      }),
    );
  }

  const list = el('div', { class: 'checks' });
  for (const result of run.results) {
    list.appendChild(
      el(
        'div',
        { class: `check check--${result.ok ? 'ok' : 'fail'}` },
        el('span', { class: 'check__icon', text: result.ok ? '✓' : '✗' }),
        el(
          'div',
          {},
          el('div', { class: 'check__title', text: result.title }),
          el('div', { class: 'check__message', text: result.message }),
        ),
      ),
    );
  }
  container.appendChild(list);
}
