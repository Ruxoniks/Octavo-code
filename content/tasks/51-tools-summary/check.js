function session(t) {
  var node = t.$('#session');
  t.assert(node, 'Терминал ещё ничего не записал — выполни хотя бы одну команду.');
  return JSON.parse(node.textContent);
}

/* Папка проекта — та, в которой лежит index.html. Как она называется, решает сам ученик. */
function projectRoot(t, state) {
  for (var path in state.fs) {
    if (!Object.prototype.hasOwnProperty.call(state.fs, path)) continue;
    if (state.fs[path].type !== 'file') continue;
    if (path.slice(-11) !== '/index.html') continue;
    return path.slice(0, -11);
  }
  return null;
}

function filesOf(state, root) {
  var found = [];
  for (var path in state.fs) {
    if (!Object.prototype.hasOwnProperty.call(state.fs, path)) continue;
    if (state.fs[path].type !== 'file') continue;
    if (path.indexOf(root + '/') !== 0) continue;
    if (path.indexOf('/.git/') !== -1) continue;
    found.push(path.slice(root.length + 1));
  }
  return found;
}

check('project-folder', 'Проект живёт в своей папке', function (t) {
  var state = session(t);
  var root = projectRoot(t, state);

  t.assert(
    root,
    'index.html нигде нет. Проект начинается с папки и точки входа: mkdir имя-папки, cd имя-папки, touch index.html.',
  );
  t.assert(
    root !== state.home,
    'index.html лежит прямо в домашней папке. Проект живёт в собственной папке, а не вперемешку с загрузками и документами.',
  );

  return 'Проект в папке ' + root.slice(root.lastIndexOf('/') + 1) + '/';
});

check('structure', 'Внутри есть структура, а не куча файлов', function (t) {
  var state = session(t);
  var root = projectRoot(t, state);
  t.assert(root, 'Сначала создай проект с index.html.');

  var files = filesOf(state, root);
  var nested = [];
  for (var i = 0; i < files.length; i++) {
    if (files[i].indexOf('/') !== -1) nested.push(files[i]);
  }

  t.assert(
    files.length >= 3,
    'Файлов в проекте: ' + files.length + '. Пустой каркас — это хотя бы точка входа, README для человека и файл со стилями.',
  );
  t.assert(
    nested.length > 0,
    'Все файлы лежат в корне. Раскладка по папкам — та самая, из задания «Структура проекта»: styles/, scripts/, assets/.',
  );

  return 'Файлов: ' + files.length + ', из них по папкам: ' + nested.length;
});

check('readme', 'Есть README для человека', function (t) {
  var state = session(t);
  var root = projectRoot(t, state);
  t.assert(root, 'Сначала создай проект с index.html.');

  var readme = state.fs[root + '/README.md'];
  t.assert(
    readme,
    'README.md нет. Его читают первым — и коллега, и ты сам через полгода. GitHub показывает его прямо на странице репозитория.',
  );

  return 'README на месте';
});

check('git-history', 'История проекта состоит не из одного шага', function (t) {
  var state = session(t);
  t.assert(state.git.initialized, 'Репозитория нет. Первая команда в новом проекте — git init.');
  t.assert(state.git.commits.length > 0, 'Коммитов нет. Пока работа не сохранена, её не существует.');
  t.assert(
    state.git.commits.length >= 2,
    'Коммит всего один. Смысл git не в том, чтобы сохранить всё разом в конце, а в том, чтобы возвращаться к любому шагу: сделал кусок работы — зафиксировал.',
  );

  for (var i = 0; i < state.git.commits.length; i++) {
    var message = state.git.commits[i].message.trim();
    t.assert(
      message.length >= 6 && ['test', 'тест', '123', 'fix', 'update', 'commit'].indexOf(message.toLowerCase()) === -1,
      'Сообщение «' + message + '» ничего не объясняет. По истории должно быть видно, что происходило с проектом.',
    );
  }

  return 'Коммитов: ' + state.git.commits.length;
});

check('main-branch', 'Ветка называется main', function (t) {
  var state = session(t);
  t.assert(
    state.git.branch === 'main',
    'Текущая ветка — «' +
      state.git.branch +
      '». По умолчанию git до сих пор создаёт master, но общая договорённость давно другая: главная ветка называется main. Переименовать: git branch -M main.',
  );
  return 'Ветка main';
});

check('published', 'Проект уехал на GitHub', function (t) {
  var state = session(t);
  t.assert(
    state.git.remote,
    'Адрес репозитория не настроен. Локальный git ничего не знает про GitHub, пока ему не скажут: git remote add origin <адрес>.',
  );
  t.assert(
    state.git.pushed,
    'Коммиты есть, адрес есть, но push не сделан. Пока код не отправлен, он существует только на твоём компьютере.',
  );
  return 'Отправлено на ' + state.git.remote;
});
