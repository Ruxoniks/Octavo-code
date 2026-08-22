function session(t) {
  var node = t.$('#session');
  t.assert(node, 'Терминал ещё ничего не записал — выполни хотя бы одну команду.');
  return JSON.parse(node.textContent);
}

function isDir(state, path) {
  return Boolean(state.fs[path]) && state.fs[path].type === 'dir';
}

function isFile(state, path) {
  return Boolean(state.fs[path]) && state.fs[path].type === 'file';
}

check('project-folder', 'Папка проекта создана', function (t) {
  var state = session(t);
  t.assert(
    isDir(state, '/home/user/site'),
    'Папки site нет. Создай её: mkdir site — и загляни внутрь командой cd site.'
  );
  return 'Папка ~/site на месте';
});

check('subfolders', 'Внутри есть styles, scripts и assets', function (t) {
  var state = session(t);
  var missing = ['styles', 'scripts', 'assets'].filter(function (name) {
    return !isDir(state, '/home/user/site/' + name);
  });
  t.assert(
    missing.length === 0,
    'Не хватает папок: ' + missing.join(', ') + '. Создать несколько сразу можно так: mkdir -p styles scripts assets'
  );
  return 'Все три папки созданы';
});

check('entry-file', 'Точка входа index.html создана', function (t) {
  var state = session(t);
  t.assert(
    isFile(state, '/home/user/site/index.html'),
    'Файла index.html нет. Пустой файл создаётся командой touch index.html — но сначала убедись, что ты внутри site (проверь pwd).'
  );
  return 'index.html лежит в корне проекта';
});

check('readme', 'README.md на месте', function (t) {
  var state = session(t);
  t.assert(
    isFile(state, '/home/user/site/README.md'),
    'Нет README.md — файла, из которого человек понимает, что это за проект.'
  );
  return 'README.md есть';
});

check('inner-files', 'Файлы разложены по папкам', function (t) {
  var state = session(t);
  var missing = [];
  if (!isFile(state, '/home/user/site/styles/style.css')) missing.push('styles/style.css');
  if (!isFile(state, '/home/user/site/scripts/app.js')) missing.push('scripts/app.js');
  t.assert(
    missing.length === 0,
    'Не хватает файлов: ' + missing.join(', ') + '. Путь можно указать прямо в команде: touch styles/style.css'
  );
  return 'style.css и app.js лежат в своих папках';
});

check('node-installed', 'Node.js установлен у тебя на компьютере', function (t) {
  var state = session(t);
  var value = state.pasted['node -v'] || '';
  t.assert(value.length > 0, 'Поле с выводом node -v пустое. Выполни команду в своей настоящей консоли и вставь ответ.');
  t.assert(
    /^v?[0-9]+[.][0-9]+[.][0-9]+/.test(value),
    'Не похоже на версию Node: «' + value + '». Ожидается что-то вроде v22.11.0. Если консоль пишет «command not found» — Node ещё не установлен.'
  );
  return 'Node ' + value;
});

check('npm-installed', 'npm установлен вместе с Node', function (t) {
  var state = session(t);
  var value = state.pasted['npm -v'] || '';
  t.assert(value.length > 0, 'Поле с выводом npm -v пустое.');
  t.assert(
    /^[0-9]+[.][0-9]+[.][0-9]+/.test(value),
    'Не похоже на версию npm: «' + value + '». Ожидается что-то вроде 10.9.0.'
  );
  return 'npm ' + value;
});
