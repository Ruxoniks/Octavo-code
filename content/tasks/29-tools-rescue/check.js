function session(t) {
  var node = t.$('#session');
  t.assert(node, 'Терминал ещё ничего не записал — выполни хотя бы одну команду.');
  return JSON.parse(node.textContent);
}

var ROOT = '/home/user/sait-final-2';

function files(state) {
  var found = [];
  for (var path in state.fs) {
    if (!Object.prototype.hasOwnProperty.call(state.fs, path)) continue;
    if (state.fs[path].type !== 'file') continue;
    if (path.indexOf(ROOT + '/') !== 0) continue;
    if (path.indexOf('/.git/') !== -1) continue;
    found.push(path.slice(ROOT.length + 1));
  }
  return found;
}

function find(state, name) {
  var all = files(state);
  for (var i = 0; i < all.length; i++) {
    var parts = all[i].split('/');
    if (parts[parts.length - 1] === name) return all[i];
  }
  return null;
}

check('entry-in-root', 'index.html лежит в корне проекта', function (t) {
  var state = session(t);
  var path = find(state, 'index.html');

  t.assert(path, 'index.html пропал. Он должен остаться в проекте — просто переехать в корень.');
  t.assert(
    path === 'index.html',
    'index.html лежит по пути «' +
      path +
      '». Точка входа живёт в корне проекта: и локальный сервер, и GitHub Pages ищут её именно там, а не в подпапке.',
  );
  return 'Точка входа на месте';
});

check('no-junk-folder', 'Папки «new folder (2)» больше нет', function (t) {
  var state = session(t);
  t.assert(
    !state.fs[ROOT + '/new folder (2)'],
    'Папка «new folder (2)» ещё здесь. Имя, которое ничего не значит, — это мина замедленного действия: через месяц никто не вспомнит, что внутри. Пустую папку удаляют так: rm -r "new folder (2)"',
  );
  return 'Мусорная папка убрана';
});

check('styles-and-scripts', 'Стили и скрипты разложены по папкам', function (t) {
  var state = session(t);
  var css = find(state, 'style.css');
  var js = find(state, 'script.js');

  t.assert(css, 'style.css пропал из проекта.');
  t.assert(js, 'script.js пропал из проекта.');

  t.assert(
    css.indexOf('/') !== -1,
    'style.css по-прежнему валяется в корне. В корне оставляют точку входа и то, что читает человек, — остальное раскладывают по папкам с говорящими именами.',
  );
  t.assert(
    js.indexOf('/') !== -1,
    'script.js по-прежнему в корне. Заведи под скрипты отдельную папку.',
  );
  t.assert(
    css.split('/')[0] !== js.split('/')[0],
    'Стили и скрипты сложены в одну папку «' +
      css.split('/')[0] +
      '». Раскладка по типу содержимого работает только тогда, когда типы действительно разные.',
  );

  return 'Стили: ' + css + ', скрипты: ' + js;
});

check('assets-together', 'Картинки собраны в одном месте', function (t) {
  var state = session(t);
  var logo = find(state, 'logo.svg');
  var photo = find(state, 'foto-cafe.svg');

  t.assert(logo && photo, 'Одна из картинок пропала: они обе должны остаться в проекте.');
  t.assert(
    logo.indexOf('/') !== -1 && photo.indexOf('/') !== -1,
    'Картинки всё ещё в корне проекта. Их бывает десятки — им нужна своя папка.',
  );
  t.assert(
    logo.split('/')[0] === photo.split('/')[0],
    'Картинки разъехались по разным папкам: «' +
      logo +
      '» и «' +
      photo +
      '». Их ищут в одном месте, а не по всему проекту.',
  );

  return 'Картинки в папке ' + logo.split('/')[0] + '/';
});

check('gitignore', 'node_modules не попадёт в репозиторий', function (t) {
  var state = session(t);
  var ignore = state.fs[ROOT + '/.gitignore'];

  t.assert(
    ignore,
    'Файла .gitignore нет. Удалять node_modules нельзя — без него проект не запустится. Но и в репозиторий его не кладут: он весит сотни мегабайт и целиком восстанавливается командой npm install.',
  );
  t.assert(
    (ignore.content || '').indexOf('node_modules') !== -1,
    '.gitignore есть, но про node_modules в нём ни слова. Одна строка: node_modules/',
  );
  return '.gitignore на месте';
});

check('committed', 'Проект сохранён в git', function (t) {
  var state = session(t);
  t.assert(state.git.initialized, 'Репозитория здесь нет. Порядок работы начинается с git init.');
  t.assert(
    state.git.commits.length > 0,
    'Коммитов нет. Разложить файлы мало — пока работа не сохранена, её не существует.',
  );

  var commit = state.git.commits[state.git.commits.length - 1];
  var message = commit.message.trim();

  t.assert(
    message.length >= 6 && ['test', 'тест', '123', 'fix', 'update', 'commit'].indexOf(message.toLowerCase()) === -1,
    'Сообщение «' + message + '» ничего не объясняет. Напиши, что сделал: «Разложил проект по папкам».',
  );

  var junk = [];
  for (var i = 0; i < commit.files.length; i++) {
    if (commit.files[i].indexOf('node_modules') !== -1) junk.push(commit.files[i]);
  }
  t.assert(
    junk.length === 0,
    'В коммит попал ' + junk[0] + '. Значит, .gitignore появился уже после git add — git успел взять папку в работу.',
  );

  return 'Коммит: «' + message + '», файлов: ' + commit.files.length;
});
