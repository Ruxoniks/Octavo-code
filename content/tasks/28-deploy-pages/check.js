function session(t) {
  var node = t.$('#session');
  t.assert(node, 'Терминал ещё ничего не записал — выполни хотя бы одну команду.');
  return JSON.parse(node.textContent);
}

check('second-commit', 'Изменение сохранено новым коммитом', function (t) {
  var state = session(t);
  t.assert(
    state.git.commits.length >= 2,
    'Коммитов всё ещё ' + state.git.commits.length + '. Измени файл (например, допиши строку в README) и сохрани изменение отдельным коммитом.'
  );
  var last = state.git.commits[state.git.commits.length - 1].message.trim();
  t.assert(last.length >= 6, 'Сообщение последнего коммита «' + last + '» слишком короткое.');
  return 'Последний коммит: «' + last + '»';
});

check('pushed-again', 'Изменение уехало на GitHub', function (t) {
  var state = session(t);
  t.assert(
    state.git.pushed,
    'Новый коммит остался на компьютере. Сайт обновится только после git push — Pages собирает страницу из того, что лежит на GitHub.'
  );
  return 'Изменения на GitHub';
});

check('live-url', 'Сайт открывается по ссылке', function (t) {
  var state = session(t);
  var value = (state.pasted['адрес опубликованного сайта'] || '').trim();
  t.assert(value.length > 0, 'Вставь адрес опубликованного сайта в поле внизу.');
  t.assert(
    /^https:\/\/[A-Za-z0-9-]+[.]github[.]io\//.test(value),
    'Адрес «' + value + '» не похож на GitHub Pages. Он выглядит так: https://имя-пользователя.github.io/имя-репозитория/'
  );
  t.assert(
    value.indexOf('github.com') === -1,
    'Это ссылка на репозиторий, а не на сайт. Опубликованная страница живёт на домене github.io — адрес показан в Settings → Pages.'
  );
  return value;
});
