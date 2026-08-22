function session(t) {
  var node = t.$('#session');
  t.assert(node, 'Терминал ещё ничего не записал — выполни хотя бы одну команду.');
  return JSON.parse(node.textContent);
}

check('git-init', 'Репозиторий создан', function (t) {
  var state = session(t);
  t.assert(
    state.git.initialized,
    'Git здесь ещё не живёт. Первая команда в любом новом проекте — git init: она создаёт скрытую папку .git.'
  );
  return 'Репозиторий инициализирован';
});

check('has-commit', 'Есть хотя бы один коммит', function (t) {
  var state = session(t);
  t.assert(
    state.git.commits.length > 0,
    'Коммитов нет. Порядок такой: git add . — выбрать, что сохраняем, затем git commit -m "сообщение" — сохранить.'
  );
  return 'Коммитов: ' + state.git.commits.length;
});

check('commit-message', 'У коммита осмысленное сообщение', function (t) {
  var state = session(t);
  t.assert(state.git.commits.length > 0, 'Сначала сделай коммит.');

  var message = state.git.commits[state.git.commits.length - 1].message.trim();
  t.assert(
    message.length >= 6,
    'Сообщение «' + message + '» слишком короткое. Через месяц ты по нему ничего не вспомнишь.'
  );
  t.assert(
    ['test', 'тест', '123', 'fix', 'update', 'commit'].indexOf(message.toLowerCase()) === -1,
    'Сообщение «' + message + '» ничего не объясняет. Пиши, что сделал: «Первая версия сайта», «Добавил блок с ценами».'
  );
  return 'Сообщение: «' + message + '»';
});

check('commit-contains-files', 'В коммит попали файлы проекта', function (t) {
  var state = session(t);
  t.assert(state.git.commits.length > 0, 'Сначала сделай коммит.');

  var files = state.git.commits[state.git.commits.length - 1].files;
  t.assert(
    files.indexOf('index.html') !== -1,
    'В коммите нет index.html. Похоже, git add захватил не всё — проверь git status до коммита.'
  );
  return 'Файлов в коммите: ' + files.length;
});

check('clean-tree', 'После коммита ничего не осталось в ожидании', function (t) {
  var state = session(t);
  t.assert(
    state.git.staged.length === 0,
    'В индексе всё ещё лежит ' + state.git.staged.length + ' файл(ов): их добавили, но не закоммитили.'
  );
  return 'Дерево чистое';
});

check('git-installed', 'Git установлен у тебя на компьютере', function (t) {
  var state = session(t);
  var value = state.pasted['git --version'] || '';
  t.assert(value.length > 0, 'Поле с выводом git --version пустое. Выполни команду в своей консоли и вставь ответ.');
  t.assert(
    /^git version [0-9]+/.test(value),
    'Не похоже на ответ git: «' + value + '». Ожидается что-то вроде «git version 2.45.0». Если команда не найдена — установи git с git-scm.com.'
  );
  return value;
});
