/* Прямой ребёнок нужного тега: селектор :scope есть не во всех средах. */
function childTag(node, name) {
  var kids = node.children;
  for (var i = 0; i < kids.length; i++) {
    if (kids[i].tagName.toLowerCase() === name) return kids[i];
  }
  return null;
}

check('article-headers', 'У каждой заметки своя шапка', function (t) {
  var articles = t.$$('article');
  t.assert(articles.length >= 3, 'Заметок на полосе: ' + articles.length + ', а должно быть три.');

  var without = [];
  for (var i = 0; i < articles.length; i++) {
    var own = childTag(articles[i], 'header');
    if (!own) without.push(t.text(articles[i].querySelector('h3')) || 'заметка ' + (i + 1));
  }

  t.assert(
    without.length === 0,
    'Заметка «' +
      String(without[0]).slice(0, 40) +
      '…» осталась без своей шапки. Заголовок и дата — начало заметки, а не случайные абзацы: их место в <header> внутри <article>.',
  );
  return 'Своя шапка у всех ' + articles.length + ' заметок';
});

check('dates-machine-readable', 'Дата понятна и человеку, и машине', function (t) {
  var times = t.$$('article time[datetime]');
  t.assert(
    times.length > 0,
    'Тега <time> с атрибутом datetime на странице нет. «18 августа» человек прочитает, а агрегатор новостей — нет: ему нужен машинный формат.',
  );
  t.assert(
    times.length >= 3,
    'Дат в формате <time datetime="…">: ' + times.length + '. Их должно быть три — по одной на заметку.',
  );

  var wrong = [];
  for (var i = 0; i < times.length; i++) {
    var value = t.attr(times[i], 'datetime') || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) wrong.push(value || '(пусто)');
  }

  t.assert(
    wrong.length === 0,
    'Дата записана как «' +
      wrong[0] +
      '». Машинный формат один на весь мир: год-месяц-день, например 2026-08-18. Иначе 08-09 — это восьмое сентября или девятое августа?',
  );
  return 'Машинных дат: ' + times.length;
});

check('article-footers', 'У каждой заметки своя подпись', function (t) {
  var articles = t.$$('article');
  var without = [];

  for (var i = 0; i < articles.length; i++) {
    var own = childTag(articles[i], 'footer');
    if (!own || t.text(own).length < 5) without.push(i + 1);
  }

  t.assert(
    without.length === 0,
    'У заметки номер ' +
      without[0] +
      ' нет своего <footer> с автором. Подпись относится к заметке, а не к газете: уедет заметка в чужую ленту — уедет и автор.',
  );
  return 'Подпись есть у всех ' + articles.length + ' заметок';
});

check('no-nesting-mistakes', 'Шапки не вложены друг в друга', function (t) {
  t.assert(
    t.count('header header') === 0,
    'Одна шапка оказалась внутри другой. Начала у начала не бывает: либо это шапка заметки, либо шапка газеты.',
  );
  t.assert(
    t.count('footer footer') === 0,
    'Один подвал оказался внутри другого. Конец у конца не бывает.',
  );
  t.assert(
    t.count('footer header') === 0,
    'Шапка оказалась внутри подвала. Подвал — заключительная часть, начинать в ней нечего.',
  );
  return 'Вложенность честная';
});

check('page-landmarks-intact', 'Шапка газеты и основное содержимое не размножились', function (t) {
  var pageHeaders = t.$$('body > header').length;
  t.assert(
    pageHeaders === 1,
    'Шапок прямо у страницы: ' +
      pageHeaders +
      '. У газеты она одна — с названием и меню. Шапки заметок лежат внутри своих <article>.',
  );

  var mains = t.count('main');
  t.assert(
    mains === 1,
    'Тегов <main> на странице: ' + mains + '. Основное содержимое одно: к двум «основным» прыгать некуда.',
  );

  var pageFooters = t.$$('body > footer').length;
  t.assert(
    pageFooters === 1,
    'Подвалов прямо у страницы: ' + pageFooters + '. Выходные данные газеты — один блок.',
  );
  return 'Опоры страницы на месте: одна шапка, один main, один подвал';
});
