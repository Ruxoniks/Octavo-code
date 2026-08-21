check('elements', 'Кнопка и статус на месте', function (t) {
  t.assert(t.$('#toggle'), 'В разметке нет кнопки #toggle.');
  t.assert(t.$('#status'), 'В разметке нет абзаца #status.');
  return 'Элементы найдены';
});

check('initial-state', 'В начале статус — «Закрыто»', function (t) {
  var text = t.text('#status');
  t.assert(
    text.toLowerCase().indexOf('закрыто') !== -1,
    'Ожидал начальный статус «Закрыто», а там: «' + text + '». Не меняй текст сразу при загрузке.'
  );
  return 'Начальное состояние верное';
});

check('click-changes', 'Клик меняет статус', function (t) {
  var button = t.$('#toggle');
  var status = t.$('#status');
  t.assert(button && status, 'Сначала найди кнопку и статус.');

  var before = t.text(status);
  button.click();
  var after = t.text(status);

  t.assert(
    before !== after,
    'После клика текст не изменился. Проверь, что обработчик действительно навешан на кнопку.'
  );
  t.assert(
    after.toLowerCase().indexOf('открыто') !== -1,
    'После первого клика ожидал «Открыто», а получил «' + after + '».'
  );
  return 'Первый клик работает';
});

check('click-toggles-back', 'Второй клик возвращает «Закрыто»', function (t) {
  var button = t.$('#toggle');
  button.click();
  var text = t.text('#status');
  t.assert(
    text.toLowerCase().indexOf('закрыто') !== -1,
    'После второго клика статус «' + text + '». Значит, текст меняется только в одну сторону — нужно переключение.'
  );
  return 'Переключение работает в обе стороны';
});
