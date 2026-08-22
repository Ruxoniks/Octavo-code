import { Sandbox } from '../core/sandbox';
import type { CheckRun, MascotConfig } from '../core/types';
import { t } from '../core/i18n';
import { el, clear } from './dom';

export interface PreviewOptions {
  /** Маскот добежал до конца — можно снова разрешить запуск. */
  onMascotFinished?: () => void;
}

/** Правая колонка: живое превью в песочнице плюс консоль сообщений из неё. */
export class PreviewPane {
  readonly element: HTMLElement;
  private frameHost: HTMLElement;
  private consoleHost: HTMLElement;
  private sandbox: Sandbox;

  constructor(options: PreviewOptions = {}) {
    this.frameHost = el('div', { class: 'preview' });
    this.consoleHost = el('div', { class: 'console' });

    this.element = el(
      'section',
      { class: 'pane pane--preview' },
      el('header', { class: 'pane__header' }, t('task.preview')),
      this.frameHost,
      el('header', { class: 'pane__header' }, t('task.console')),
      this.consoleHost,
    );

    this.sandbox = new Sandbox(this.frameHost, {
      onConsole: (level, text) => this.log(level, text),
      onMascotFinished: options.onMascotFinished,
    });
  }

  log(level: string, text: string): void {
    const line = el('div', {
      class: `console__line console__line--${level}`,
      text: text,
    });
    this.consoleHost.appendChild(line);
    this.consoleHost.scrollTop = this.consoleHost.scrollHeight;
  }

  clearConsole(): void {
    clear(this.consoleHost);
  }

  async render(files: Record<string, string>, entry: string): Promise<void> {
    this.clearConsole();
    await this.sandbox.render(files, entry);
  }

  runChecks(source: string, timeoutMs: number, mascot?: MascotConfig): Promise<CheckRun> {
    return this.sandbox.runChecks(source, timeoutMs, mascot);
  }

  playMascot(mascot: MascotConfig): Promise<void> {
    return this.sandbox.playMascot(mascot);
  }

  destroy(): void {
    this.sandbox.destroy();
  }
}
