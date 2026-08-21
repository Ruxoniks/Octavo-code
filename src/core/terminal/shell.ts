/**
 * Симулятор консоли.
 *
 * Ученику нужны настоящие команды, а не кнопка «сделать хорошо»: он печатает
 * `git commit` без `git add` и читает ту же ошибку, что получил бы в терминале —
 * только с человеческим пояснением следом.
 *
 * Модуль намеренно чистый: никакого DOM, только состояние и текст. Поэтому его
 * можно и в тестах гонять, и в браузере, и сериализовать в JSON для проверок.
 */

export type FsEntryType = 'dir' | 'file';

export interface FsEntry {
  type: FsEntryType;
  content?: string;
}

export interface GitState {
  initialized: boolean;
  branch: string;
  staged: string[];
  commits: { message: string; files: string[] }[];
  remote?: string;
  pushed: boolean;
  /**
   * Содержимое файлов на момент последнего коммита. Именно по нему git
   * понимает, что файл изменился, — без этого «git add .» после правки
   * ничего бы не находил.
   */
  snapshot: Record<string, string>;
}

export interface ShellState {
  cwd: string;
  home: string;
  fs: Record<string, FsEntry>;
  git: GitState;
  /** Вывод настоящей консоли ученика: команда → то, что она ответила. */
  pasted: Record<string, string>;
  history: string[];
}

export interface CommandResult {
  state: ShellState;
  output: string;
  isError: boolean;
}

export const NODE_VERSION = 'v22.11.0';
export const NPM_VERSION = '10.9.0';
export const GIT_VERSION = 'git version 2.45.0';

export interface ShellOptions {
  home?: string;
  cwd?: string;
  files?: Record<string, FsEntry>;
  /** Задание может начинаться с уже созданного репозитория. */
  git?: Partial<GitState>;
}

export function createShell(options: ShellOptions = {}): ShellState {
  const home = options.home ?? '/home/user';
  const state: ShellState = {
    cwd: options.cwd ?? home,
    home,
    fs: { '/': { type: 'dir' }, '/home': { type: 'dir' }, [home]: { type: 'dir' }, ...(options.files ?? {}) },
    git: {
      initialized: false,
      branch: 'master',
      staged: [],
      commits: [],
      pushed: false,
      snapshot: {},
      ...options.git,
    },
    pasted: {},
    history: [],
  };

  // Репозиторий, который задание выдаёт уже с коммитами, должен считаться
  // чистым: снимок собираем из того, что лежит в рабочей папке.
  if (state.git.initialized && state.git.commits.length && !Object.keys(state.git.snapshot).length) {
    for (const file of filesInside(state, state.cwd)) {
      state.git.snapshot[file] = state.fs[state.cwd + '/' + file].content ?? '';
    }
  }

  return state;
}

function clone(state: ShellState): ShellState {
  return JSON.parse(JSON.stringify(state)) as ShellState;
}

// ---------- пути ----------

export function normalizePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return '/' + parts.join('/');
}

export function resolvePath(state: ShellState, raw: string): string {
  const input = raw.trim();
  if (!input || input === '~') return state.home;
  if (input.startsWith('~/')) return normalizePath(state.home + '/' + input.slice(2));
  if (input.startsWith('/')) return normalizePath(input);
  return normalizePath(state.cwd + '/' + input);
}

function parentOf(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf('/');
  return index <= 0 ? '/' : normalized.slice(0, index);
}

export function baseName(path: string): string {
  const normalized = normalizePath(path);
  return normalized.slice(normalized.lastIndexOf('/') + 1) || '/';
}

/** Путь относительно домашней папки — так его показывает приглашение и git. */
export function shortPath(state: ShellState, path: string): string {
  if (path === state.home) return '~';
  return path.startsWith(state.home + '/') ? '~' + path.slice(state.home.length) : path;
}

export function listDir(state: ShellState, path: string): string[] {
  const prefix = path === '/' ? '/' : path + '/';
  return Object.keys(state.fs)
    .filter((key) => key.startsWith(prefix) && key !== path)
    .map((key) => key.slice(prefix.length))
    .filter((rest) => rest.length > 0 && !rest.includes('/'))
    .sort();
}

/** Файлы внутри рабочей папки, кроме служебных — то, что видит git. */
export function filesInside(state: ShellState, path: string): string[] {
  const prefix = path === '/' ? '/' : path + '/';
  return Object.keys(state.fs)
    .filter((key) => key.startsWith(prefix) && state.fs[key].type === 'file' && !key.includes('/.git/'))
    .map((key) => key.slice(prefix.length))
    .sort();
}

// ---------- разбор строки ----------

export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (const char of input.trim()) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ' ') {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

// ---------- команды ----------

const HELP = [
  'Доступные команды:',
  '  pwd                    где я сейчас',
  '  ls [папка]             что лежит рядом',
  '  cd <папка>             перейти в папку (.. — на уровень вверх)',
  '  mkdir [-p] <папка>     создать папку',
  '  touch <файл>           создать пустой файл',
  '  cat <файл>             показать содержимое файла',
  '  echo "текст" > файл    записать текст в файл',
  '  rm [-r] <путь>         удалить файл или папку',
  '  node -v / npm -v       проверить, что установлено',
  '  git ...                init, status, add, commit, log, branch, remote, push, pull, clone',
  '  clear                  очистить экран',
].join('\n');

function ok(state: ShellState, output = ''): CommandResult {
  return { state, output, isError: false };
}

function fail(state: ShellState, output: string): CommandResult {
  return { state, output, isError: true };
}

export function runCommand(previous: ShellState, input: string): CommandResult {
  const line = input.trim();
  const state = clone(previous);
  if (line) state.history.push(line);
  if (!line) return ok(state);

  const tokens = tokenize(line);
  const [command, ...args] = tokens;

  switch (command) {
    case 'help':
      return ok(state, HELP);

    case 'clear':
      return ok(state, '');

    case 'pwd':
      return ok(state, state.cwd);

    case 'ls': {
      const target = resolvePath(state, args[0] ?? '.');
      const entry = state.fs[target];
      if (!entry) return fail(state, `ls: ${args[0] ?? '.'}: такой папки нет`);
      if (entry.type === 'file') return ok(state, baseName(target));
      const items = listDir(state, target);
      return ok(state, items.length ? items.join('  ') : '(пусто)');
    }

    case 'cd': {
      const target = resolvePath(state, args[0] ?? '~');
      const entry = state.fs[target];
      if (!entry) return fail(state, `cd: ${args[0]}: такой папки нет. Посмотри ls — что рядом?`);
      if (entry.type !== 'dir') return fail(state, `cd: ${args[0]}: это файл, а не папка`);
      state.cwd = target;
      return ok(state);
    }

    case 'mkdir': {
      const recursive = args.includes('-p');
      const targets = args.filter((arg) => arg !== '-p');
      if (!targets.length) return fail(state, 'mkdir: не указано имя папки');

      for (const raw of targets) {
        const path = resolvePath(state, raw);
        if (state.fs[path]) return fail(state, `mkdir: ${raw}: уже существует`);
        if (!recursive && !state.fs[parentOf(path)]) {
          return fail(
            state,
            `mkdir: ${raw}: нет родительской папки. Добавь флаг -p, чтобы создать всю цепочку сразу.`,
          );
        }
        // -p создаёт всю цепочку папок разом.
        const parts = path.slice(1).split('/');
        let current = '';
        for (const part of parts) {
          current += '/' + part;
          if (!state.fs[current]) state.fs[current] = { type: 'dir' };
        }
      }
      return ok(state);
    }

    case 'touch': {
      if (!args.length) return fail(state, 'touch: не указано имя файла');
      for (const raw of args) {
        const path = resolvePath(state, raw);
        if (!state.fs[parentOf(path)]) return fail(state, `touch: ${raw}: нет такой папки`);
        if (!state.fs[path]) state.fs[path] = { type: 'file', content: '' };
      }
      return ok(state);
    }

    case 'cat': {
      const path = resolvePath(state, args[0] ?? '');
      const entry = state.fs[path];
      if (!entry) return fail(state, `cat: ${args[0]}: нет такого файла`);
      if (entry.type === 'dir') return fail(state, `cat: ${args[0]}: это папка`);
      return ok(state, entry.content ?? '');
    }

    case 'echo': {
      const redirect = args.findIndex((arg) => arg === '>' || arg === '>>');
      const text = (redirect === -1 ? args : args.slice(0, redirect)).join(' ');
      if (redirect === -1) return ok(state, text);

      const raw = args[redirect + 1];
      if (!raw) return fail(state, 'echo: не указан файл после >');
      const path = resolvePath(state, raw);
      if (!state.fs[parentOf(path)]) return fail(state, `echo: ${raw}: нет такой папки`);
      const previousContent = args[redirect] === '>>' ? (state.fs[path]?.content ?? '') : '';
      state.fs[path] = { type: 'file', content: previousContent ? previousContent + '\n' + text : text };
      return ok(state);
    }

    case 'rm': {
      const recursive = args.some((arg) => arg === '-r' || arg === '-rf' || arg === '-fr');
      const raw = args.find((arg) => !arg.startsWith('-'));
      if (!raw) return fail(state, 'rm: не указан путь');
      const path = resolvePath(state, raw);
      const entry = state.fs[path];
      if (!entry) return fail(state, `rm: ${raw}: нет такого файла`);
      if (entry.type === 'dir' && !recursive) {
        return fail(state, `rm: ${raw}: это папка. Чтобы удалить её целиком, нужен флаг -r.`);
      }
      for (const key of Object.keys(state.fs)) {
        if (key === path || key.startsWith(path + '/')) delete state.fs[key];
      }
      return ok(state);
    }

    case 'node':
    case 'npm': {
      const flag = args[0];
      if (flag === '-v' || flag === '--version') {
        return ok(state, command === 'node' ? NODE_VERSION : NPM_VERSION);
      }
      return fail(state, `${command}: здесь поддерживается только ${command} -v`);
    }

    case 'git':
      return runGit(state, args);

    default:
      return fail(state, `${command}: команда не найдена. Напиши help — покажу список.`);
  }
}

function runGit(state: ShellState, args: string[]): CommandResult {
  const [sub, ...rest] = args;

  if (sub === '--version') return ok(state, GIT_VERSION);
  if (!sub) return ok(state, 'usage: git <команда>. Напиши help, чтобы увидеть список.');

  if (sub !== 'init' && sub !== 'clone' && !state.git.initialized) {
    return fail(
      state,
      'fatal: not a git repository (or any of the parent directories): .git\n' +
        'Репозитория здесь нет — начни с git init.',
    );
  }

  switch (sub) {
    case 'init': {
      if (state.git.initialized) return ok(state, 'Reinitialized existing Git repository');
      state.git.initialized = true;
      state.fs[state.cwd + '/.git'] = { type: 'dir' };
      return ok(state, `Initialized empty Git repository in ${state.cwd}/.git/`);
    }

    case 'status': {
      const all = filesInside(state, state.cwd);
      const staged = state.git.staged;
      const tracked = (file: string): boolean => file in state.git.snapshot;
      const rest2 = all.filter((file) => !staged.includes(file));
      const untracked = rest2.filter((file) => !tracked(file));
      const modified = rest2.filter((file) => tracked(file) && state.git.snapshot[file] !== contentOf(state, file));

      const lines = [`On branch ${state.git.branch}`];
      if (staged.length) {
        lines.push(
          '',
          'Changes to be committed:',
          ...staged.map((file) => `  ${tracked(file) ? 'modified:' : 'new file:'}   ${file}`),
        );
      }
      if (modified.length) {
        lines.push('', 'Changes not staged for commit:', ...modified.map((file) => `  modified:   ${file}`));
      }
      if (untracked.length) {
        lines.push('', 'Untracked files:', ...untracked.map((file) => `  ${file}`));
      }
      if (!staged.length && !untracked.length && !modified.length) {
        lines.push('nothing to commit, working tree clean');
      }
      return ok(state, lines.join('\n'));
    }

    case 'add': {
      const target = rest[0];
      if (!target) return fail(state, 'Nothing specified, nothing added.\nОбычно пишут git add . — добавить всё.');
      const all = filesInside(state, state.cwd);
      // Изменённым считается файл, содержимое которого разошлось со снимком
      // последнего коммита — как и в настоящем git.
      const changed = all.filter((file) => state.git.snapshot[file] !== contentOf(state, file));

      const everything = target === '.' || target === '-A';
      const picked = everything
        ? changed
        : all.filter((file) => file === target || file.startsWith(target.replace(/\/$/, '') + '/'));

      if (!picked.length) {
        return fail(
          state,
          everything
            ? 'nothing to add — рабочая папка совпадает с последним коммитом.\n' +
                'Сначала измени или создай файл, потом добавляй.'
            : `fatal: pathspec '${target}' did not match any files\n` +
                'Проверь ls: такого файла в этой папке нет.',
        );
      }
      state.git.staged = Array.from(new Set([...state.git.staged, ...picked])).sort();
      return ok(state);
    }

    case 'commit': {
      const messageIndex = rest.findIndex((arg) => arg === '-m');
      const message = messageIndex === -1 ? '' : rest[messageIndex + 1];

      if (!state.git.staged.length) {
        return fail(
          state,
          'nothing added to commit but untracked files present\n' +
            'Сначала git add . — коммит собирается из добавленного, а не из всей папки.',
        );
      }
      if (!message) {
        return fail(
          state,
          'Aborting commit due to empty commit message.\n' +
            'Сообщение обязательно: git commit -m "что сделал".',
        );
      }

      state.git.commits.push({ message, files: [...state.git.staged] });
      for (const file of state.git.staged) {
        state.git.snapshot[file] = contentOf(state, file);
      }
      const count = state.git.staged.length;
      state.git.staged = [];
      state.git.pushed = false;
      return ok(state, `[${state.git.branch} ${randomHash(state)}] ${message}\n ${count} file(s) changed`);
    }

    case 'log': {
      if (!state.git.commits.length) {
        return fail(state, 'fatal: your current branch does not have any commits yet');
      }
      const oneline = rest.includes('--oneline');
      const lines = [...state.git.commits].reverse().map((commit, index) => {
        const hash = randomHash(state, index);
        return oneline ? `${hash} ${commit.message}` : `commit ${hash}\n\n    ${commit.message}\n`;
      });
      return ok(state, lines.join('\n'));
    }

    case 'branch': {
      const renameIndex = rest.findIndex((arg) => arg === '-M' || arg === '-m');
      if (renameIndex !== -1) {
        const name = rest[renameIndex + 1];
        if (!name) return fail(state, 'fatal: не указано новое имя ветки');
        state.git.branch = name;
        return ok(state);
      }
      return ok(state, `* ${state.git.branch}`);
    }

    case 'remote': {
      if (rest[0] === 'add') {
        const url = rest[2];
        if (rest[1] !== 'origin' || !url) {
          return fail(state, 'usage: git remote add origin <адрес репозитория>');
        }
        if (!/^(https:\/\/|git@)/.test(url)) {
          return fail(
            state,
            `fatal: '${url}' не похож на адрес репозитория.\n` +
              'Скопируй ссылку со страницы репозитория на GitHub — она начинается с https://',
          );
        }
        state.git.remote = url;
        return ok(state);
      }
      if (rest[0] === '-v') {
        return state.git.remote
          ? ok(state, `origin  ${state.git.remote} (fetch)\norigin  ${state.git.remote} (push)`)
          : ok(state, '(remote не настроен)');
      }
      return fail(state, 'usage: git remote add origin <адрес> | git remote -v');
    }

    case 'push': {
      if (!state.git.remote) {
        return fail(
          state,
          'fatal: No configured push destination.\n' +
            'Сначала скажи git, куда пушить: git remote add origin <адрес>.',
        );
      }
      if (!state.git.commits.length) {
        return fail(state, 'error: src refspec main does not match any\nПушить нечего — сделай коммит.');
      }
      state.git.pushed = true;
      const upstream = rest.includes('-u') || rest.includes('--set-upstream');
      return ok(
        state,
        `To ${state.git.remote}\n * [new branch]      ${state.git.branch} -> ${state.git.branch}` +
          (upstream ? `\nbranch '${state.git.branch}' set up to track 'origin/${state.git.branch}'.` : ''),
      );
    }

    case 'pull':
      return ok(state, 'Already up to date.');

    case 'clone': {
      const url = rest[0];
      if (!url) return fail(state, 'usage: git clone <адрес>');
      const name = (rest[1] ?? baseName(url)).replace(/\.git$/, '');
      const path = resolvePath(state, name);
      state.fs[path] = { type: 'dir' };
      state.fs[path + '/index.html'] = { type: 'file', content: '<!doctype html>' };
      state.fs[path + '/.git'] = { type: 'dir' };
      return ok(state, `Cloning into '${name}'...\ndone.`);
    }

    default:
      return fail(state, `git: '${sub}' is not a git command.\nНапиши help — там список того, что здесь работает.`);
  }
}

function contentOf(state: ShellState, file: string): string {
  return state.fs[state.cwd + '/' + file]?.content ?? '';
}

/** Стабильный «хеш» из длины истории — настоящий git тут не нужен, нужен вид. */
function randomHash(state: ShellState, offset = 0): string {
  const base = (state.history.length + 1) * 2654435761 + offset * 40503;
  return (base >>> 0).toString(16).padStart(7, '0').slice(0, 7);
}
