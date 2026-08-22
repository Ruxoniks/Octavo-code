/*
  Итог главы про семантику. Каждая проверка — одно умение, и в сообщении
  об ошибке названо задание, которое этому умению учило.
*/
function childTag(node, name) {
  var kids = node.children;
  for (var i = 0; i < kids.length; i++) {
    if (kids[i].tagName.toLowerCase() === name) return kids[i];
  }
  return null;
}

check('page-titled', 'Страница представляется браузеру', function (t) {
  var title = t.text('title');
  t.assert(title.length > 0, 'Подпись вкладки пустая: за неё отвечает <title> внутри <head>.');
  t.assert(
    title !== 'Документ',
    'В <title> так и осталось стандартное «Документ». Это первое, что человек видит во вкладке и в закладке.',
  );
  t.assert(
    (t.attr('html', 'lang') || '').length > 0,
    'У тега <html> нет атрибута lang. По нему работают переводчики и программы чтения вслух: им нужно знать, на каком языке читать.',
  );
  return 'Вкладка подписана: «' + title + '»';
});

check('landmarks', 'Опоры страницы названы', function (t) {
  var missing = [];
  if (!t.$('body > header')) missing.push('шапка страницы');
  if (!t.$('main')) missing.push('основное содержимое');
  if (!t.$('body > footer')) missing.push('подвал страницы');

  t.assert(
    missing.length === 0,
    'Не хватает: ' + missing.join(', ') + '. Это задание «Суп из дивов»: три опоры, по которым страницу читают машины.',
  );
  t.assert(
    t.count('main') === 1,
    'Тегов <main> на странице: ' + t.count('main') + '. Основное содержимое одно — с этого начиналась починка страницы от нейросети.',
  );
  t.assert(
    t.count('footer header') === 0,
    'Шапка оказалась внутри подвала. Задание «Три шапки на одной странице»: <header> — начало раздела, <footer> — его конец.',
  );
  t.assert(
    t.count('header header') === 0,
    'Одна шапка попала внутрь другой. Задание «Три шапки на одной странице»: начала у начала не бывает.',
  );
  return 'Шапка, основное содержимое и подвал на месте';
});

check('single-h1', 'Главный заголовок один', function (t) {
  var count = t.count('h1');
  t.assert(count > 0, 'Заголовка <h1> нет. Он отвечает на вопрос «что это за страница».');
  t.assert(count === 1, 'Заголовков <h1> на странице: ' + count + '. Главная мысль у страницы одна.');
  t.assert(
    t.$('header h1'),
    '<h1> оказался за пределами шапки. Название газеты — часть <header>, там же, где меню.',
  );
  return 'Заголовок: «' + t.text('h1') + '»';
});

check('nav-anchors', 'Меню названо навигацией и ведёт к разделам', function (t) {
  var nav = t.$('header nav');
  t.assert(
    t.$('nav'),
    'Тега <nav> нет. Задание «Навигация и поля страницы»: меню нужно назвать, иначе тот, кто слушает страницу, не сможет его пропустить.',
  );
  t.assert(nav, 'Тег <nav> есть, но не в шапке. Меню газеты — часть <header>.');

  var links = nav.querySelectorAll('a');
  t.assert(links.length >= 2, 'Ссылок в меню: ' + links.length + '. Разделов на полосе несколько — дай ссылку хотя бы на два.');

  var broken = [];
  for (var i = 0; i < links.length; i++) {
    var href = t.attr(links[i], 'href') || '';
    if (href === '' || href === '#') {
      broken.push('«' + t.text(links[i]) + '» ведёт в никуда');
    } else if (href.charAt(0) === '#' && !t.$(href)) {
      broken.push('«' + t.text(links[i]) + '» ищет ' + href + ', а такого раздела нет');
    }
  }
  t.assert(
    broken.length === 0,
    'Сломанная ссылка: ' + broken[0] + '. Якорь href="#novosti" находит элемент с id="novosti" — задание «Навигация и поля страницы».',
  );
  return 'Меню: ссылок ' + links.length;
});

check('articles-separable', 'Заметки можно унести со страницы', function (t) {
  var articles = t.$$('article');
  t.assert(
    articles.length > 0,
    'На полосе нет ни одной <article>. Задание «Отделяемое и неотделимое»: заметка остаётся понятной и в чужой ленте.',
  );
  t.assert(articles.length >= 2, 'Заметок: ' + articles.length + '. Их нужно хотя бы две.');

  var without = [];
  for (var i = 0; i < articles.length; i++) {
    if (!articles[i].querySelector('h1, h2, h3, h4, h5, h6')) without.push(i + 1);
  }
  t.assert(
    without.length === 0,
    'У заметки номер ' + without[0] + ' нет заголовка. Вынесенная заметка начинается с него — иначе непонятно, что это.',
  );
  return 'Самостоятельных заметок: ' + articles.length;
});

check('article-parts', 'У заметки своё начало и своя подпись', function (t) {
  var articles = t.$$('article');
  t.assert(articles.length > 0, 'Заметок на странице нет.');

  var noHead = [];
  var noFoot = [];
  for (var i = 0; i < articles.length; i++) {
    if (!childTag(articles[i], 'header')) noHead.push(i + 1);
    if (!childTag(articles[i], 'footer')) noFoot.push(i + 1);
  }

  t.assert(
    noHead.length === 0,
    'У заметки номер ' + noHead[0] + ' нет своей шапки. Задание «Три шапки на одной странице»: заголовок и дата — начало заметки, а не случайные абзацы.',
  );
  t.assert(
    noFoot.length === 0,
    'У заметки номер ' + noFoot[0] + ' нет своей подписи. Автор относится к заметке: уедет заметка в чужую ленту — уедет и он.',
  );

  var times = t.$$('article time[datetime]');
  t.assert(
    times.length >= articles.length,
    'Дат в формате <time datetime="…">: ' + times.length + ', а заметок ' + articles.length + '. Задание «Три шапки на одной странице»: человек читает «21 августа», машина — datetime.',
  );

  var wrong = [];
  for (var j = 0; j < times.length; j++) {
    var value = t.attr(times[j], 'datetime') || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) wrong.push(value || '(пусто)');
  }
  t.assert(
    wrong.length === 0,
    'Дата записана как «' + wrong[0] + '». Машинный формат один: год-месяц-день, например 2026-08-21.',
  );
  return 'У всех ' + articles.length + ' заметок есть начало, подпись и машинная дата';
});

check('section-and-aside', 'Неотделимое и косвенное на своих местах', function (t) {
  var sections = t.$$('main section');
  t.assert(
    sections.length > 0,
    'На полосе нет ни одного <section>. Задание «Отделяемое и неотделимое»: раздел газеты — это не article, вынести его нельзя.',
  );

  var titled = 0;
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].querySelector('h1, h2, h3, h4, h5, h6')) titled++;
  }
  t.assert(
    titled > 0,
    'Ни у одного раздела нет заголовка. Раздел без заголовка невозможно назвать — ни человеку, ни программе чтения.',
  );

  var aside = t.$('aside');
  t.assert(
    aside,
    'Врезки нет. Задание «Навигация и поля страницы»: <aside> — то, что связано с основным косвенно, убери его — новости не пострадают.',
  );
  t.assert(t.text(aside).length > 20, 'Врезка пустая — напиши в ней что-нибудь настоящее.');
  t.assert(
    t.count('nav aside') === 0 && t.count('aside nav') === 0,
    'Врезка и меню перепутались: одно оказалось внутри другого.',
  );
  return 'Разделов: ' + sections.length + ', врезка на месте';
});

check('table-data', 'Табличные данные — таблицей', function (t) {
  var table = t.$('table');
  t.assert(
    table,
    'Расписания-таблицы на полосе нет. Задание «Расписание электричек»: сетку рисует и CSS, а таблица задаёт связи между числом и его заголовками.',
  );
  t.assert(
    t.$('table caption'),
    'У таблицы нет <caption>. Подпись объясняет, что это за таблица, и её слышат первой.',
  );

  var cols = t.$$('table th[scope="col"]');
  t.assert(
    cols.length >= 2,
    'Заголовков столбцов со scope="col": ' + cols.length + '. Без scope ячейка просто выделена жирным.',
  );

  var rows = t.$$('table tbody tr');
  t.assert(rows.length >= 2, 'Строк с данными: ' + rows.length + '. Станций в расписании должно быть хотя бы две.');

  var wrongFirst = [];
  for (var i = 0; i < rows.length; i++) {
    var first = rows[i].children[0];
    if (!first) continue;
    if (first.tagName.toLowerCase() !== 'th' || t.attr(first, 'scope') !== 'row') {
      wrongFirst.push(t.text(first));
    }
  }
  t.assert(
    wrongFirst.length === 0,
    'Ячейка «' + wrongFirst[0] + '» — название станции, то есть заголовок своей строки: <th scope="row">. Иначе время есть, а откуда поезд — нет.',
  );
  return 'Таблица: столбцов ' + cols.length + ', строк ' + rows.length;
});
