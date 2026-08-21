import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';

const VIRTUAL_PREFIX = '\0octavo-text:';

/**
 * Файлы заданий из content/ подключаются как текст (`?raw`): их содержимое
 * попадает и в редактор, и в песочницу, и в скачиваемый ZIP.
 *
 * Штатный `?raw` для .css не годится: встроенный обработчик Vite всё равно
 * считает такой запрос стилями и возвращает пустую строку. Поэтому пути из
 * content/ уводятся в виртуальный модуль (префикс \0), который другие плагины
 * не трогают, и читаются с диска как есть.
 */
function contentAsText(): Plugin {
  let root = process.cwd();

  return {
    name: 'octavo-content-as-text',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
    },
    resolveId(source, importer) {
      const [request, query] = source.split('?');
      const normalized = request.split('\\').join('/');
      if (query !== 'raw' || !normalized.includes('/content/')) return null;

      // import.meta.glob отдаёт пути то от корня проекта («/content/…»),
      // то относительно импортёра («../../content/…»), поэтому разбираем оба случая.
      const hasDriveLetter = /^[A-Za-z]:/.test(normalized);
      const importerDir = importer ? path.dirname(importer.split('?')[0]) : root;
      const absolute = hasDriveLetter
        ? normalized
        : normalized.startsWith('/')
          ? path.join(root, normalized.slice(1))
          : path.resolve(importerDir, normalized);

      // Путь кодируется, а не подставляется как есть: иначе исходное расширение
      // остаётся в адресе модуля, и .css достаётся обработчику стилей, а .svg —
      // раздаче статики, которая такого файла не находит и отвечает 404.
      return encodeVirtualId(absolute);
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return null;
      const file = decodeVirtualId(id);
      // Виртуальный модуль сам по себе не связан с файлом на диске,
      // поэтому watcher о нём надо сказать явно.
      this.addWatchFile(file);
      return `export default ${JSON.stringify(fs.readFileSync(file, 'utf8'))};`;
    },
    handleHotUpdate({ file, server, modules }) {
      const virtualId = encodeVirtualId(file);
      const virtualModule = server.moduleGraph.getModuleById(virtualId);
      if (!virtualModule) return;

      // Правка задания должна быть видна сразу, без перезапуска сервера.
      server.moduleGraph.invalidateModule(virtualModule);
      server.ws.send({ type: 'full-reload' });
      return [...modules, virtualModule];
    },
  };
}

function encodeVirtualId(file: string): string {
  const encoded = Buffer.from(file.split('\\').join('/'), 'utf8').toString('base64url');
  return `${VIRTUAL_PREFIX}${encoded}.js`;
}

function decodeVirtualId(id: string): string {
  const encoded = id.slice(VIRTUAL_PREFIX.length).replace(/\.js$/, '');
  return Buffer.from(encoded, 'base64url').toString('utf8');
}

export default defineConfig({
  // Относительный base — сборка одинаково работает и на GitHub Pages, и из подпапки.
  base: './',
  plugins: [contentAsText()],
  server: { port: 5173, open: false },
  build: { target: 'es2022', outDir: 'dist' },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.spec.ts'],
  },
});
