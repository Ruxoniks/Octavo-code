import type { Beat } from './briefBeats';
import { voiceOf } from './voices';
import { cursorSvg } from './mascot';
import { renderMarkdown } from './markdown';
import { t } from '../core/i18n';
import { append, clear, el } from './dom';

/**
 * Диалоговое окно задания.
 *
 * Текст брифа подаётся репликами: видно ровно столько, сколько ученик
 * успел прочитать, а не стену на пол-экрана. Прочитанное остаётся выше —
 * можно вернуться глазами, не листая назад.
 */
export class Dialogue {
  readonly element: HTMLElement;
  private beats: Beat[];
  private shown = 1;
  private body: HTMLElement;
  private footer: HTMLElement;

  constructor(beats: Beat[]) {
    this.beats = beats.length ? beats : [{ speaker: 'КУРСОР', markdown: t('dialogue.empty') }];
    this.body = el('div', { class: 'dialogue__body' });
    this.footer = el('div', { class: 'dialogue__footer' });

    this.element = el(
      'section',
      {
        class: 'dialogue',
        attrs: { role: 'group', 'aria-label': t('task.brief') },
        on: {
          click: (event: MouseEvent) => {
            // Клик по кнопкам в подвале обрабатывается ими самими.
            if ((event.target as HTMLElement).closest('button')) return;
            this.next();
          },
        },
      },
      this.body,
      this.footer,
    );

    this.render();
  }

  /** Добавить реплику по ходу задания — например, правку от заказчика. */
  addBeat(beat: Beat): void {
    this.beats.push(beat);
    this.shown = this.beats.length;
    this.render();
  }

  private next(): void {
    if (this.shown >= this.beats.length) return;
    this.shown += 1;
    this.render();
  }

  private previous(): void {
    if (this.shown <= 1) return;
    this.shown -= 1;
    this.render();
  }

  private showAll(): void {
    this.shown = this.beats.length;
    this.render();
  }

  private render(): void {
    clear(this.body);
    clear(this.footer);

    let previousSpeaker = '';
    for (const beat of this.beats.slice(0, this.shown)) {
      const voice = voiceOf(beat.speaker);
      const sameSpeaker = beat.speaker === previousSpeaker;
      previousSpeaker = beat.speaker;

      this.body.appendChild(
        el(
          'article',
          { class: 'dialogue__beat' },
          el(
            'div',
            { style: 'display:flex;gap:var(--sp-3)' },
            el('div', {
              class: 'dialogue__portrait',
              html: voice.glyph ? `<span>${voice.glyph}</span>` : cursorSvg({ size: 22 }),
              style: sameSpeaker ? 'visibility:hidden' : '',
            }),
            el(
              'div',
              { class: 'dialogue__content' },
              sameSpeaker ? null : el('div', { class: 'dialogue__speaker', text: voice.name }),
              el('div', { class: 'dialogue__text', html: renderMarkdown(beat.markdown) }),
            ),
          ),
        ),
      );
    }

    const hasMore = this.shown < this.beats.length;

    append(this.footer, [
      el('button', {
        text: '← ' + t('dialogue.prev'),
        disabled: this.shown <= 1,
        on: { click: () => this.previous() },
      }),
      el('button', {
        text: hasMore ? t('dialogue.next') + ' →' : t('dialogue.end'),
        disabled: !hasMore,
        on: { click: () => this.next() },
      }),
      hasMore
        ? el('button', { class: 'ghost', text: t('dialogue.all'), on: { click: () => this.showAll() } })
        : null,
      el('span', { class: 'dialogue__counter', text: `${this.shown} / ${this.beats.length}` }),
    ]);

    // Новая реплика всегда видна.
    requestAnimationFrame(() => {
      this.body.scrollTop = this.body.scrollHeight;
    });
  }
}
