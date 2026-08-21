import type { CheckResult, ClientPersona } from '../core/types';
import { t } from '../core/i18n';
import { el, clear } from './dom';

/**
 * Симуляция заказчика.
 *
 * ТЗ написано обычным человеческим языком и намеренно неполно, зато приёмка
 * — это конкретный чек-лист, привязанный к проверкам. После нескольких попыток
 * заказчик присылает правку: так и бывает в реальной работе.
 */
export interface ClientPanelState {
  persona: ClientPersona;
  attempts: number;
  results: CheckResult[];
}

export function revisionActive(persona: ClientPersona, attempts: number): boolean {
  return Boolean(persona.revision && attempts >= persona.revision.afterAttempts);
}

/** Критерии, по которым сейчас оценивается работа. */
export function activeCriteria(persona: ClientPersona, attempts: number): { id: string; label: string }[] {
  return revisionActive(persona, attempts)
    ? [...persona.acceptance, ...persona.revision!.acceptance]
    : persona.acceptance;
}

export function renderClientPanel(container: HTMLElement, state: ClientPanelState): void {
  clear(container);
  const { persona, attempts, results } = state;

  container.appendChild(
    el(
      'div',
      { class: 'client__persona' },
      el('div', { class: 'client__avatar', text: persona.avatar }),
      el(
        'div',
        {},
        el('div', { class: 'client__name', text: persona.name }),
        el('div', { class: 'client__role', text: persona.role }),
      ),
    ),
  );

  container.appendChild(
    el('div', { class: 'message' }, el('div', { class: 'message__time', text: 'ТЗ' }), el('div', { text: persona.brief })),
  );

  if (revisionActive(persona, attempts)) {
    container.appendChild(
      el(
        'div',
        { class: 'message message--new' },
        el('div', { class: 'message__time', text: t('client.newMessage') }),
        el('div', { text: persona.revision!.message }),
      ),
    );
  }

  const byId = new Map(results.map((r) => [r.id, r]));
  const list = el('div', { class: 'acceptance' });

  for (const criterion of activeCriteria(persona, attempts)) {
    const result = byId.get(criterion.id);
    const ok = Boolean(result?.ok);
    list.appendChild(
      el(
        'div',
        { class: `acceptance__item acceptance__item--${ok ? 'ok' : 'fail'}` },
        el('span', { class: 'acceptance__box', text: ok ? '☑' : '☐' }),
        el(
          'div',
          {},
          el('div', { text: criterion.label }),
          result && !result.ok ? el('div', { class: 'check__message', text: result.message }) : null,
        ),
      ),
    );
  }

  container.appendChild(el('h3', { text: t('client.acceptance') }));
  container.appendChild(list);
}
