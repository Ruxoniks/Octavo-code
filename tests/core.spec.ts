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
