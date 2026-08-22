import type { CheckResult, Question } from '../core/types';
import { t } from '../core/i18n';
import { el, clear } from './dom';

/**
 * Вопросы по коду. Используются и в заданиях на чтение кода, и в разборе того,
 * что принесла нейросеть: понять чужой код — отдельный навык.
 */
export class QuestionSet {
  readonly element: HTMLElement;
  private questions: Question[];
  private answers = new Map<string, number>();

  constructor(questions: Question[]) {
    this.questions = questions;
    this.element = el('div', { class: 'quiz' });
    this.render();
  }

  results(): CheckResult[] {
    return this.questions.map((question) => {
      const given = this.answers.get(question.id);
      const ok = given === question.answer;
      return {
        id: question.id,
        title: question.prompt,
        ok,
        message: ok ? question.explain : t('quiz.wrong'),
      };
    });
  }

  private render(): void {
    clear(this.element);

    for (const question of this.questions) {
      const given = this.answers.get(question.id);
      const card = el('div', {}, el('p', { text: question.prompt }));

      for (const [index, option] of (question.options ?? []).entries()) {
        card.appendChild(
          el('button', {
            class: 'quiz__option',
            attrs: { 'aria-pressed': String(given === index) },
            text: option,
            on: {
              click: () => {
                this.answers.set(question.id, index);
                this.render();
              },
            },
          }),
        );
      }

      this.element.appendChild(card);
    }
  }
}

/** Код только для чтения: пронумерованные строки, на которые ссылаются вопросы. */
export function renderCodeView(source: string): HTMLElement {
  const view = el('pre', { class: 'code-view' });
  source.replace(/\r\n/g, '\n').split('\n').forEach((text, index) => {
    view.appendChild(
      el(
        'div',
        {
          class: 'code-view__line',
          attrs: { 'data-line': String(index + 1) },
        },
        el('span', { class: 'code-view__num', text: String(index + 1) }),
        el('span', { text: text || ' ' }),
      ),
    );
  });
  return view;
}
