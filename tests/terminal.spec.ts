import { describe, expect, it } from 'vitest';
import { createShell, listDir, runCommand, type ShellState } from '../src/core/terminal/shell';

/**
 * Симулятор консоли — обучающий инструмент, поэтому важны не только успешные
 * сценарии, но и ошибки: именно на них ученик понимает, как git устроен.
 */
function run(state: ShellState, ...commands: string[]): { state: ShellState; output: string; isError: boolean } {
  let current = state;
  let last = { state, output: '', isError: false };
  for (const command of commands) {
    last = runCommand(current, command);
    current = last.state;
  }
  return last;
}

describe('файловая система', () => {
  it('mkdir -p создаёт всю цепочку папок', () => {
    const { state } = run(createShell(), 'mkdir -p site/styles/theme');
    expect(state.fs['/home/user/site']?.type).toBe('dir');
    expect(state.fs['/home/user/site/styles']?.type).toBe('dir');
    expect(state.fs['/home/user/site/styles/theme']?.type).toBe('dir');
  });

  it('mkdir без -p объясняет, чего не хватает', () => {
    const result = run(createShell(), 'mkdir site/styles');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('-p');
  });

  it('cd меняет рабочую папку, а ls показывает содержимое', () => {
    const { state } = run(createShell(), 'mkdir site', 'cd site', 'touch index.html');
    expect(state.cwd).toBe('/home/user/site');
    expect(listDir(state, '/home/user/site')).toEqual(['index.html']);
  });

  it('cd в несуществующую папку подсказывает посмотреть ls', () => {
    const result = run(createShell(), 'cd nowhere');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('ls');
  });

  it('echo со стрелкой пишет в файл, а с двойной — дописывает', () => {
    const { state } = run(
      createShell(),
      'echo "первая" > note.txt',
      'echo "вторая" >> note.txt',
    );
    expect(state.fs['/home/user/note.txt']?.content).toBe('первая\nвторая');
  });

  it('mv кладёт файл в существующую папку под тем же именем', () => {
    const { state } = run(createShell(), 'touch style.css', 'mkdir styles', 'mv style.css styles');
    expect(state.fs['/home/user/style.css']).toBeUndefined();
    expect(state.fs['/home/user/styles/style.css']?.type).toBe('file');
  });

  it('mv переименовывает, если такой папки нет', () => {
    const { state } = run(createShell(), 'touch main.html', 'mv main.html index.html');
    expect(state.fs['/home/user/main.html']).toBeUndefined();
    expect(state.fs['/home/user/index.html']?.type).toBe('file');
  });

  it('mv переносит папку вместе с содержимым', () => {
    const { state } = run(
      createShell(),
      'mkdir -p old/inner',
      'touch old/inner/app.js',
      'mkdir site',
      'mv old site',
    );
    expect(state.fs['/home/user/old']).toBeUndefined();
    expect(state.fs['/home/user/site/old/inner/app.js']?.type).toBe('file');
  });

  it('mv не затирает того, что уже лежит на месте', () => {
    const result = run(createShell(), 'touch a.txt', 'mkdir dir', 'touch dir/a.txt', 'mv a.txt dir');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('уже есть');
  });

  it('.gitignore прячет папку и от add, и от status', () => {
    const result = run(
      createShell(),
      'mkdir site',
      'cd site',
      'touch index.html',
      'mkdir node_modules',
      'touch node_modules/left-pad.js',
      'echo "node_modules/" > .gitignore',
      'git init',
      'git add .',
      'git commit -m "Первая версия"',
      'git status',
    );

    const committed = result.state.git.commits[0].files;
    expect(committed).toContain('index.html');
    expect(committed).toContain('.gitignore');
    expect(committed.some((file) => file.startsWith('node_modules/'))).toBe(false);
    expect(result.output).toContain('working tree clean');
  });

  // Задание «Чужая папка» должно проходиться теми командами, которые в нём
  // упомянуты. Проверки задания смотрят на итог, а этот тест — на путь к нему.
  it('сценарий задания «Чужая папка» проходится целиком', () => {
    const messy = createShell({
      cwd: '/home/user/sait-final-2',
      files: {
        '/home/user/sait-final-2': { type: 'dir' },
        '/home/user/sait-final-2/style.css': { type: 'file', content: 'body { margin: 0 }' },
        '/home/user/sait-final-2/script.js': { type: 'file', content: "console.log('hi')" },
        '/home/user/sait-final-2/logo.svg': { type: 'file', content: '<svg></svg>' },
        '/home/user/sait-final-2/new folder (2)': { type: 'dir' },
        '/home/user/sait-final-2/new folder (2)/index.html': { type: 'file', content: '<!doctype html>' },
        '/home/user/sait-final-2/node_modules': { type: 'dir' },
        '/home/user/sait-final-2/node_modules/left-pad.js': { type: 'file', content: 'module.exports = 1' },
      },
    });

    const { state } = run(
      messy,
      'mkdir styles scripts assets',
      'mv style.css styles',
      'mv script.js scripts',
      'mv logo.svg assets',
      'mv "new folder (2)/index.html" .',
      'rm -r "new folder (2)"',
      'echo "node_modules/" > .gitignore',
      'git init',
      'git add .',
      'git commit -m "Разложил проект по папкам"',
    );

    expect(state.fs['/home/user/sait-final-2/index.html']?.type).toBe('file');
    expect(state.fs['/home/user/sait-final-2/styles/style.css']?.type).toBe('file');
    expect(state.fs['/home/user/sait-final-2/new folder (2)']).toBeUndefined();
    expect(state.fs['/home/user/sait-final-2/node_modules/left-pad.js']?.type).toBe('file');
    expect(state.git.commits[0].files).not.toContain('node_modules/left-pad.js');
  });

  // Итог главы «Инструменты»: от пустой домашней папки до отправленного проекта.
  it('сценарий итога главы проходится целиком', () => {
    const { state } = run(
      createShell(),
      'mkdir portfolio',
      'cd portfolio',
      'touch index.html README.md',
      'mkdir styles',
      'touch styles/style.css',
      'echo "node_modules/" > .gitignore',
      'git init',
      'git add .',
      'git commit -m "Каркас проекта"',
      'echo "body { margin: 0 }" > styles/style.css',
      'git add .',
      'git commit -m "Добавил файл со стилями"',
      'git branch -M main',
      'git remote add origin https://github.com/anya/portfolio.git',
      'git push -u origin main',
    );

    expect(state.git.commits).toHaveLength(2);
    expect(state.git.branch).toBe('main');
    expect(state.git.pushed).toBe(true);
    expect(state.fs['/home/user/portfolio/styles/style.css']?.type).toBe('file');
  });

  it('неизвестная команда отправляет к help', () => {
    const result = run(createShell(), 'gti status');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('help');
  });
});

describe('git', () => {
  const withProject = (): ShellState =>
    createShell({
      cwd: '/home/user/site',
      files: {
        '/home/user/site': { type: 'dir' },
        '/home/user/site/index.html': { type: 'file', content: '<!doctype html>' },
      },
    });

  it('любая команда до init объясняет, что репозитория нет', () => {
    const result = run(withProject(), 'git status');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('git init');
  });

  it('commit без add объясняет, что коммит собирается из добавленного', () => {
    const result = run(withProject(), 'git init', 'git commit -m "старт"');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('git add');
  });

  it('commit без сообщения не проходит', () => {
    const result = run(withProject(), 'git init', 'git add .', 'git commit');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('-m');
  });

  it('счастливый путь доводит до коммита и очищает индекс', () => {
    const { state } = run(withProject(), 'git init', 'git add .', 'git commit -m "Первая версия"');
    expect(state.git.commits).toHaveLength(1);
    expect(state.git.commits[0].files).toContain('index.html');
    expect(state.git.staged).toEqual([]);
  });

  it('push без remote объясняет, что адрес не задан', () => {
    const result = run(withProject(), 'git init', 'git add .', 'git commit -m "Первая версия"', 'git push');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('git remote add origin');
  });

  it('remote отклоняет адрес, который не похож на репозиторий', () => {
    const result = run(withProject(), 'git init', 'git remote add origin просто-текст');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('https://');
  });

  it('полный путь до GitHub заканчивается запушенной веткой main', () => {
    const { state } = run(
      withProject(),
      'git init',
      'git add .',
      'git commit -m "Первая версия"',
      'git remote add origin https://github.com/user/site.git',
      'git branch -M main',
      'git push -u origin main',
    );
    expect(state.git.branch).toBe('main');
    expect(state.git.remote).toBe('https://github.com/user/site.git');
    expect(state.git.pushed).toBe(true);
  });

  it('новый коммит после пуша снова помечает ветку неотправленной', () => {
    const pushed = run(
      withProject(),
      'git init',
      'git add .',
      'git commit -m "Первая версия"',
      'git remote add origin https://github.com/user/site.git',
      'git push -u origin main',
    ).state;

    const { state } = run(pushed, 'touch about.html', 'git add .', 'git commit -m "Добавил страницу"');
    expect(state.git.commits).toHaveLength(2);
    expect(state.git.pushed).toBe(false);
  });
});

describe('изменения после коммита', () => {
  it('изменённый файл снова попадает в git add и git status', () => {
    const start = createShell({
      cwd: '/home/user/site',
      files: {
        '/home/user/site': { type: 'dir' },
        '/home/user/site/README.md': { type: 'file', content: '# Мой сайт' },
      },
      git: {
        initialized: true,
        branch: 'main',
        commits: [{ message: 'Первая версия сайта', files: ['README.md'] }],
      },
    });

    // Репозиторий, выданный заданием, должен считаться чистым.
    expect(run(start, 'git status').output).toContain('working tree clean');

    const edited = run(start, 'echo "Опубликован" >> README.md');
    expect(run(edited.state, 'git status').output).toContain('modified');

    const { state } = run(edited.state, 'git add .', 'git commit -m "Обновил описание"');
    expect(state.git.commits).toHaveLength(2);
    expect(run(state, 'git status').output).toContain('working tree clean');
  });

  it('git add . без единой правки честно говорит, что добавлять нечего', () => {
    const start = createShell({
      cwd: '/home/user/site',
      files: {
        '/home/user/site': { type: 'dir' },
        '/home/user/site/README.md': { type: 'file', content: '# Мой сайт' },
      },
      git: { initialized: true, commits: [{ message: 'Первая версия', files: ['README.md'] }] },
    });

    const result = run(start, 'git add .');
    expect(result.isError).toBe(true);
    expect(result.output).toContain('nothing to add');
  });
});
