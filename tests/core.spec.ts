import { describe, expect, it } from 'vitest';
import { Window } from 'happy-dom';
import { collapseDiff, diffLines, hasChanges } from '../src/core/files';
import { parseAiResponse } from '../src/core/ai';
import { renderMarkdown } from '../src/ui/markdown';
import { buildSrcDoc } from '../src/core/sandbox';

describe('дифф файлов', () => {
  it('находит добавленные и удалённые строки', () => {
    const diff = diffLines('a\nb\nc', 'a\nB\nc');
    expect(hasChanges(diff)).toBe(true);
    expect(diff.filter((line) => line.kind === 'del').map((line) => line.text)).toEqual(['b']);
    expect(diff.filter((line) => line.kind === 'add').map((line) => line.text)).toEqual(['B']);
  });

  it('не видит изменений в одинаковых файлах', () => {
    expect(hasChanges(diffLines('одно\nдва', 'одно\nдва'))).toBe(false);
  });

  it('сворачивает длинные неизменённые куски', () => {
    const before = Array.from({ length: 40 }, (_, i) => `строка ${i}`).join('\n');
    const after = before.replace('строка 20', 'строка двадцать');
    const collapsed = collapseDiff(diffLines(before, after));
    expect(collapsed.length).toBeLessThan(15);
    expect(collapsed.some((line) => line.text === '…')).toBe(true);
  });
});

describe('разбор ответа нейросети', () => {
  const known = ['index.html', 'style.css'];

  it('берёт имя файла из строки перед блоком', () => {
    const answer = [
      'Вот что я поменял.',
      '',
      'index.html:',
      '```html',
      '<h1>Привет</h1>',
      '```',
      '',
      'Файл style.css:',
      '```css',
      'h1 { color: red; }',
      '```',
    ].join('\n');

    expect(parseAiResponse(answer, known)).toEqual([
      { file: 'index.html', content: '<h1>Привет</h1>' },
      { file: 'style.css', content: 'h1 { color: red; }' },
    ]);
  });

  it('определяет файл по языку блока, если имя не указано', () => {
    const answer = '```css\nbody { margin: 0; }\n```';
    expect(parseAiResponse(answer, known)).toEqual([{ file: 'style.css', content: 'body { margin: 0; }' }]);
  });

  it('игнорирует блоки без понятного файла', () => {
    const answer = '```bash\nnpm install\n```';
    expect(parseAiResponse(answer, known)).toEqual([]);
  });
});

describe('markdown брифов', () => {
  it('превращает заголовки, списки и код в разметку', () => {
    const html = renderMarkdown('# Заголовок\n\n- один\n- два\n\n```html\n<b>жирный</b>\n```');
    expect(html).toContain('<h2>Заголовок</h2>');
    expect(html).toContain('<li>один</li>');
    expect(html).toContain('&lt;b&gt;жирный&lt;/b&gt;');
  });

  it('экранирует HTML из текста задания', () => {
    expect(renderMarkdown('Опасно: <script>alert(1)</script>')).not.toContain('<script>');
  });
});

describe('сборка песочницы', () => {
  const files = {
    'index.html':
      '<!doctype html><html><head><link rel="stylesheet" href="style.css" /></head><body><img src="pic.svg" /><script src="app.js"></script></body></html>',
    'style.css': 'body { color: red; }',
    'app.js': 'console.log("привет");',
    'pic.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  };

  it('подставляет содержимое css, js и картинок внутрь документа', () => {
    const doc = buildSrcDoc(files, 'index.html');
    expect(doc).toContain('body { color: red; }');
    expect(doc).toContain('console.log("привет")');
    expect(doc).toContain('src="data:image/svg+xml;charset=utf-8,');
    expect(doc).not.toContain('href="style.css"');
  });

  it('добавляет рантайм проверок в документ', () => {
    expect(buildSrcDoc(files, 'index.html')).toContain('data-octavo-runtime');
  });
});

describe('физика подъёма курсора', () => {
  async function climb(html: string, options: Record<string, number>): Promise<{ ok: boolean; message: string }> {
    const window = new Window({ url: 'https://octavo.local/' });
    window.document.write(buildSrcDoc({ 'index.html': html }, 'index.html'));
    window.document.close();
    await window.happyDOM.waitUntilComplete();

    const runtime = (
      window as unknown as {
        __octavo: { helpers: { mascot: { canClimb: (o: unknown) => { ok: boolean; message: string } } } };
      }
    ).__octavo;

    const outcome = runtime.helpers.mascot.canClimb(options);
    await window.happyDOM.close();
    return outcome;
  }

  it('без ступенек лезть некуда', async () => {
    const outcome = await climb('<!doctype html><html><body></body></html>', {});
    expect(outcome.ok).toBe(false);
    expect(outcome.message).toContain('Ступенек меньше двух');
  });

  it('в среде без геометрии проверка честно пропускается', async () => {
    const html =
      '<!doctype html><html><body><div class="step">1</div><div class="step">2</div></body></html>';
    const outcome = await climb(html, {});
    expect(outcome.ok).toBe(true);
    expect(outcome.message).toContain('пропущена');
  });
});

describe('ссылки в превью', () => {
  async function clickLink(markup: string): Promise<{
    opened: string[];
    prevented: boolean;
    hints: string[];
  }> {
    const window = new Window({ url: 'https://octavo.local/' });
    const opened: string[] = [];
    const hints: string[] = [];

    // Превью — отдельный origin, поэтому наверх уходят только сообщения.
    (window as unknown as { parent: unknown }).parent = {
      postMessage: (message: { type?: string; text?: string }) => {
        if (message?.type === 'octavo:console' && message.text) hints.push(message.text);
      },
    };
    // Рантайм открывает вкладку с признаком noopener. happy-dom тоже зовёт
    // open, когда сама переходит по ссылке, — эти вызовы нам не интересны.
    (window as unknown as { open: (url: string, target?: string, features?: string) => void }).open = (
      url: string,
      _target?: string,
      features?: string,
    ) => {
      if (features === 'noopener') opened.push(url);
    };

    window.document.write(buildSrcDoc({ 'index.html': markup }, 'index.html'));
    window.document.close();
    await window.happyDOM.waitUntilComplete();

    const link = window.document.querySelector('a') as unknown as {
      dispatchEvent: (event: unknown) => boolean;
    };
    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    const prevented = (event as unknown as { defaultPrevented: boolean }).defaultPrevented;

    await window.happyDOM.close();
    return { opened, prevented, hints };
  }

  const page = (link: string): string =>
    `<!doctype html><html><head></head><body>${link}</body></html>`;

  it('внешнюю ссылку без target открывает в новой вкладке и объясняет почему', async () => {
    const result = await clickLink(page('<a href="https://example.com/">Наружу</a>'));

    expect(result.opened).toEqual(['https://example.com/']);
    expect(result.prevented).toBe(true);
    expect(result.hints.join(' ')).toContain('target="_blank"');
  });

  it('ссылку с target="_blank" отдаёт браузеру как есть', async () => {
    const result = await clickLink(page('<a href="https://example.com/" target="_blank">Наружу</a>'));

    expect(result.opened).toEqual([]);
    expect(result.prevented).toBe(false);
    expect(result.hints).toEqual([]);
  });

  it('якорь внутри страницы не трогает', async () => {
    const result = await clickLink(page('<a href="#anchor">Вниз</a>'));

    expect(result.opened).toEqual([]);
    expect(result.prevented).toBe(false);
  });
});

describe('линейка композиции', () => {
  async function withRuntime<T>(markup: string, fn: (layout: LayoutHelpers) => T): Promise<T> {
    const window = new Window({ url: 'https://octavo.local/' });
    window.document.write(buildSrcDoc({ 'index.html': markup }, 'index.html'));
    window.document.close();
    await window.happyDOM.waitUntilComplete();

    const runtime = (window as unknown as { __octavo: { helpers: { layout: LayoutHelpers } } }).__octavo;
    const result = fn(runtime.helpers.layout);
    await window.happyDOM.close();
    return result;
  }

  interface LayoutHelpers {
    available: () => boolean;
    lines: (target: string) => unknown[];
    leftEdges: (selector: string) => number[];
    spread: (numbers: number[]) => number;
    gaze: (selector: string) => { points: unknown[]; jumps: number[]; maxJump: number; meanJump: number };
    fontScale: (a: string, b: string) => number;
    lineHeight: (target: string) => number | null;
    columnCount: (value: string) => number;
  }

  const page = (body: string, style = ''): string =>
    `<!doctype html><html><head><style>${style}</style></head><body>${body}</body></html>`;

  it('разброс считается по краям набора', async () => {
    const spread = await withRuntime(page('<p>текст</p>'), (layout) => layout.spread([24, 40, 24, 8]));
    expect(spread).toBe(32);
  });

  it('пустой набор разброса не имеет', async () => {
    expect(await withRuntime(page('<p>текст</p>'), (layout) => layout.spread([]))).toBe(0);
  });

  // Вне браузера геометрии нет вовсе: Range отдаёт пустой список, а не нули,
  // поэтому проверки, которые сюда ходят, обязаны быть check.browser.
  it('вне браузера линейка честно говорит, что мерить нечем', async () => {
    const report = await withRuntime(page('<h1>Заголовок</h1><p>Текст подлиннее</p>'), (layout) => ({
      available: layout.available(),
      lines: layout.lines('h1').length,
      gazePoints: layout.gaze('h1, p').points.length,
    }));

    expect(report.available).toBe(false);
    expect(report.lines).toBe(0);
    expect(report.gazePoints).toBe(0);
  });

  it('контраст масштаба считается и без раскладки', async () => {
    const scale = await withRuntime(
      page('<h1>Заголовок</h1><p>Текст</p>', 'h1{font-size:40px}p{font-size:16px}'),
      (layout) => layout.fontScale('h1', 'p'),
    );
    expect(scale).toBe(2.5);
  });

  it('межстрочный интервал приводится к отношению в любой среде', async () => {
    const report = await withRuntime(
      page('<h1>А</h1><p>Б</p>', 'h1{font-size:40px;line-height:1.1}p{font-size:16px;line-height:32px}'),
      (layout) => ({ heading: layout.lineHeight('h1'), text: layout.lineHeight('p') }),
    );

    expect(report.heading).toBeCloseTo(1.1, 5);
    // 32px при кегле 16px — это ровно два интервала.
    expect(report.text).toBeCloseTo(2, 5);
  });

  it('колонки сетки считаются и в авторской записи, и в разложенной', async () => {
    const counts = await withRuntime(page('<div></div>'), (layout) => [
      layout.columnCount('repeat(3, 1fr)'),
      layout.columnCount('212px 212px 212px'),
      layout.columnCount('minmax(120px, 1fr) 2fr'),
      layout.columnCount('none'),
      layout.columnCount(''),
    ]);

    expect(counts).toEqual([3, 3, 2, 0, 0]);
  });
});
