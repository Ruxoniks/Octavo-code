function session(t) {
  var node = t.$('#session');
  t.assert(node, 'Терминал ещё ничего не записал — выполни хотя бы одну команду.');
  return JSON.parse(node.textContent);
}

check('remote-added', 'Репозиторий знает, куда пушить', function (t) {
  var state = session(t);
  t.assert(
    state.git.remote,
    'Удалённый репозиторий не настроен. Команда: git remote add origin <адрес>. Адрес берут со страницы репозитория на GitHub.'
  );
  t.assert(
    /^https:\/\/github[.]com\//.test(state.git.remote) || /^git@github[.]com:/.test(state.git.remote),
    'Адрес «' + state.git.remote + '» не похож на GitHub. Скопируй ссылку из зелёной кнопки Code на странице репозитория.'
  );
  return 'origin → ' + state.git.remote;
});

check('branch-main', 'Ветка называется main', function (t) {
  var state = session(t);
  t.assert(
    state.git.branch === 'main',
    'Текущая ветка — «' + state.git.branch + '». GitHub по умолчанию ждёт main: переименуй командой git branch -M main.'
  );
  return 'Ветка main';
});

check('pushed', 'Код уехал на GitHub', function (t) {
  var state = session(t);
  t.assert(
    state.git.pushed,
    'Push ещё не сделан. Первый раз пушат так: git push -u origin main — флаг -u запоминает, куда пушить дальше.'
  );
  return 'Код на GitHub';
});

check('repo-url', 'Ссылка на твой репозиторий', function (t) {
  var state = session(t);
  var value = state.pasted['адрес репозитория'] || '';
  t.assert(value.length > 0, 'Вставь адрес своего репозитория на GitHub в поле внизу.');
  t.assert(
    /^https:\/\/github[.]com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(value.replace(/\/$/, '')),
    'Адрес «' + value + '» не похож на страницу репозитория. Ожидается вид https://github.com/имя-пользователя/имя-репозитория'
  );
  return value;
});
