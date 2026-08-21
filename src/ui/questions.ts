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

  /** Номер строки, выбранной кликом в коде, уходит в первый неотвеченный вопрос типа line. */
  setLine(lineNumber: number): void {
    const target = this.questions.find((q) => q.kind === 'line' && !this.answers.has(q.id));
    const question = target ?? [...this.questions].reverse().find((q) => q.kind === 'line');
    if (!question) return;
    this.answers.set(question.id, lineNumber);
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
        message: ok
          ? question.explain
          : given === undefined
            ? t('quiz.selectLine')
            : t('quiz.wrong'),
      };
    });
  }

  private render(): void {
    clear(this.element);

    for (const question of this.questions) {
      const given = this.answers.get(question.id);
      const card = el('div', {}, el('p', { text: question.prompt }));

      if (question.kind === 'choice') {
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
      } else {
        card.appendChild(
          el('p', {
            class: 'tiny muted',
            text: given === undefined ? t('quiz.selectLine') : `Выбрана строка ${given}`,
          }),
        );
      }

      this.element.appendChild(card);
    }
  }
}

/** Код только для чтения с кликабельными строками. */
export function renderCodeView(source: string, onLineClick: (line: number) => void): HTMLElement {
  const view = el('pre', { class: 'code-view' });
  source.replace(/\r\n/g, '\n').split('\n').forEach((text, index) => {
    const number = index + 1;
    const line = el(
      'div',
      {
        class: 'code-view__line',
        attrs: { 'aria-selected': 'false', 'data-line': String(number) },
        on: {
          click: () => {
            view.querySelectorAll('.code-view__line').forEach((node) =>
              node.setAttribute('aria-selected', 'false'),
            );
            line.setAttribute('aria-selected', 'true');
            onLineClick(number);
          },
        },
      },
      el('span', { class: 'code-view__num', text: String(number) }),
      el('span', { text: text || ' ' }),
    );
    view.appendChild(line);
  });
  return view;
}
