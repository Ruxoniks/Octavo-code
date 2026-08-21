import runtimeSource from './runtime/runtime.js?raw';
import type { CheckRun, MascotConfig } from './types';

/**
 * Песочница превью.
 *
 * iframe создаётся БЕЗ allow-same-origin. Это значит:
 *   - код ученика (и код, принесённый от нейросети) не видит страницу игры,
 *     её localStorage и прогресс;
 *   - родитель не может читать DOM песочницы, поэтому проверки исполняются
 *     внутри неё (см. runtime/runtime.js), а сюда приходит только результат.
 *
 * allow-popups нужен, чтобы работал target="_blank": без него браузер молча
 * блокирует открытие вкладки, и ученик думает, что сломал ссылку.
 * allow-popups-to-escape-sandbox снимает песочницу с открытой вкладки — иначе
 * настоящий сайт откроется в ней сломанным.
 */

let runCounter = 0;

export interface SandboxCallbacks {
  onConsole?: (level: string, text: string) => void;
  onMascotFinished?: () => void;
}

/** Собирает единый HTML-документ: подставляет CSS и JS проекта прямо в разметку. */
export function buildSrcDoc(files: Record<string, string>, entry: string): string {
  let html = files[entry] ?? '<!doctype html><html><body></body></html>';

  // <link rel="stylesheet" href="style.css"> → <style>…</style>
  html = html.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href: string) => {
    const content = files[href.replace(/^\.\//, '')];
    if (content === undefined || !/stylesheet/i.test(match)) return match;
    return `<style data-file="${href}">\n${content}\n</style>`;
  });

  // <script src="app.js"></script> → <script>…</script>
  html = html.replace(
    /<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    (match, _pre: string, src: string) => {
      const content = files[src.replace(/^\.\//, '')];
      if (content === undefined) return match;
      return `<script data-file="${src}">\n${content}\n</script>`;
    },
  );

  // <img src="cursor.svg"> → data-URI: в песочнице нет своего origin,
  // поэтому относительные пути к файлам проекта надо подставить содержимым.
  html = html.replace(/(<img\b[^>]*\bsrc=)["']([^"']+)["']/gi, (match, prefix: string, src: string) => {
    const content = files[src.replace(/^\.\//, '')];
    if (content === undefined) return match;
    const mime = src.endsWith('.svg') ? 'image/svg+xml' : 'text/plain';
    return `${prefix}"data:${mime};charset=utf-8,${encodeURIComponent(content)}"`;
  });

  const runtimeTag = `<script data-octavo-runtime>\n${runtimeSource}\n</script>`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, (m) => `${m}\n${runtimeTag}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, (m) => `${m}\n${runtimeTag}`);
  }
  return runtimeTag + html;
}

export class Sandbox {
  private iframe: HTMLIFrameElement;
  private ready: Promise<void> = Promise.resolve();
  private resolveReady: () => void = () => {};
  private callbacks: SandboxCallbacks;

  constructor(container: HTMLElement, callbacks: SandboxCallbacks = {}) {
    this.callbacks = callbacks;
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'preview__frame';
    this.iframe.title = 'Превью страницы';
    this.iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox',
    );
    container.appendChild(this.iframe);
    window.addEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent): void => {
    if (event.source !== this.iframe.contentWindow) return;
    const data = event.data as { type?: string; level?: string; text?: string };
    if (!data || typeof data !== 'object') return;

    if (data.type === 'octavo:ready') {
      this.resolveReady();
    } else if (data.type === 'octavo:console') {
      this.callbacks.onConsole?.(data.level ?? 'log', data.text ?? '');
    } else if (data.type === 'octavo:mascot-finished') {
      this.callbacks.onMascotFinished?.();
    }
  };

  /** Полностью пересоздаёт документ песочницы. */
  render(files: Record<string, string>, entry: string): Promise<void> {
    this.ready = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
    this.iframe.srcdoc = buildSrcDoc(files, entry);
    // Если рантайм по какой-то причине не отозвался, не подвешиваем интерфейс.
    const guard = new Promise<void>((resolve) => setTimeout(resolve, 1500));
    return Promise.race([this.ready, guard]);
  }

  /** Просит песочницу выполнить проверки и ждёт результат с таймаутом. */
  async runChecks(source: string, timeoutMs: number, mascot?: MascotConfig): Promise<CheckRun> {
    await this.ready;
    const win = this.iframe.contentWindow;
    if (!win) return { ok: false, results: [], error: 'Песочница не готова' };

    const runId = ++runCounter;

    return new Promise<CheckRun>((resolve) => {
      let settled = false;

      const finish = (run: CheckRun): void => {
        if (settled) return;
        settled = true;
        window.removeEventListener('message', listener);
        clearTimeout(timer);
        clearInterval(retry);
        resolve(run);
      };

      const listener = (event: MessageEvent): void => {
        if (event.source !== this.iframe.contentWindow) return;
        const data = event.data as { type?: string; runId?: number; outcome?: CheckRun };
        if (data?.type === 'octavo:results' && data.runId === runId && data.outcome) {
          finish(data.outcome);
        }
      };

      const timer = setTimeout(() => {
        clearInterval(retry);
        finish({
          ok: false,
          results: [],
          error:
            'Проверка не ответила за ' +
            timeoutMs +
            ' мс. Скорее всего, в коде бесконечный цикл — превью перезапущено.',
        });
      }, timeoutMs);

      window.addEventListener('message', listener);

      // Документ песочницы могли пересоздать прямо перед проверкой, и тогда
      // первое сообщение уходит в никуда. Повторяем запрос, пока не ответят.
      const ask = (): void => {
        this.iframe.contentWindow?.postMessage({ type: 'octavo:run-checks', runId, source, mascot }, '*');
      };
      const retry = setInterval(ask, 150);
      ask();
    });
  }

  playMascot(mascot: MascotConfig): void {
    this.iframe.contentWindow?.postMessage({ type: 'octavo:play-mascot', mascot }, '*');
  }

  destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.iframe.remove();
  }
}
