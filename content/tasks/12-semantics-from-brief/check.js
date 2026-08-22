check('landmarks', 'Страница разложена на части', function (t) {
  var missing = [];
  if (!t.$('header')) missing.push('<header>');
  if (!t.$('main')) missing.push('<main>');
  if (!t.$('footer')) missing.push('<footer>');

  t.assert(
    missing.length === 0,
    'Не хватает частей страницы: ' + missing.join(', ') + '. Это было в задании «Суп из дивов»: три опоры, на которых держится любая страница.',
  );
  t.assert(t.count('main') === 1, 'Тегов <main> на странице: ' + t.count('main') + '. Основное содержимое одно.');
  return 'Шапка, основная часть и подвал на месте';
});

check('nav-real-links', 'Меню сайта — настоящая навигация', function (t) {
  var nav = t.$('header nav');
  t.assert(
    t.$('nav'),
    'Тега <nav> нет. Меню газеты — набор ссылок, ради которых человек пришёл в шапку, его нужно назвать навигацией.',
  );
  t.assert(nav, 'Тег <nav> есть, но не в шапке. Меню сайта — часть <header>.');

  var links = nav.querySelectorAll('a[href]');
  t.assert(links.length >= 2, 'Ссылок в меню: ' + links.length + ', а редактор просил три.');

  var broken = [];
  for (var i = 0; i < links.length; i++) {
    var href = t.attr(links[i], 'href') || '';
    if (!/^https?:\/\//i.test(href)) broken.push(href || '(пусто)');
  }
  t.assert(
    broken.length === 0,
    'Ссылка «' + broken[0] + '» ведёт не туда. Меню сайта ссылается на другие страницы — это настоящие адреса, а не «#».',
  );
  return 'В меню ссылок: ' + links.length;
});

check('article-self-contained', 'Статья — самостоятельный материал', function (t) {
  var article = t.$('main article');
  t.assert(
    article,
    'Тега <article> внутри <main> нет. Статью можно унести на другой сайт, и она не потеряет смысл — задание «Отделяемое и неотделимое».',
  );
  t.assert(
    article.querySelector('h1, h2, h3, h4, h5, h6'),
    'У статьи нет заголовка. Унесённая на другой сайт статья без заголовка непонятна — что это вообще такое?',
  );

  var paragraphs = article.querySelectorAll('p').length;
  t.assert(
    paragraphs >= 3,
    'Абзацев текста в статье: ' + paragraphs + '. Редактор прислал четыре — перескажи их отдельными <p>, а не одним сплошным куском.',
  );
  return 'Статья самостоятельна, абзацев: ' + paragraphs;
});

check('article-photo', 'Фотография с описанием', function (t) {
  var image = t.$('article img');
  t.assert(image, 'Фотографии внутри статьи нет. Файл bridge.svg лежит рядом с index.html.');

  var alt = t.normalize(t.attr(image, 'alt') || '');
  t.assert(alt.length > 0, 'У картинки нет alt. Человек, который не видит фото, должен узнать по описанию, что на нём.');
  t.assert(
    alt.split(' ').length >= 3,
    'Описание «' + alt + '» слишком короткое — по нему сложно представить, что на фотографии.',
  );
  return 'Фото описано: «' + alt + '»';
});

check('inline-link-new-tab', 'Ссылка на протокол не уводит со страницы', function (t) {
  var article = t.$('article');
  t.assert(article, 'Статьи на странице нет.');

  var links = article.querySelectorAll('p a[href]');
  var external = null;
  for (var i = 0; i < links.length; i++) {
    if (/^https?:\/\//i.test(t.attr(links[i], 'href') || '')) external = links[i];
  }

  t.assert(external, 'Ссылки на протокол горсовета внутри статьи нет.');
  t.assert(
    t.attr(external, 'target') === '_blank',
    'Ссылка на протокол уведёт человека со страницы — он не дочитает статью. Открой её в новой вкладке через target="_blank", как в задании «Страница по описанию» с ссылкой на карту.',
  );
  return 'Протокол открывается рядом, статья остаётся';
});

check('aside-and-note', 'Врезка и примечание не перепутаны', function (t) {
  var aside = t.$('aside');
  t.assert(
    aside,
    'Тега <aside> нет. Цифры про длину и годы стройки связаны со статьёй лишь косвенно — убери их, и статья всё равно понятна. Это <aside>, задание «Навигация и поля страницы».',
  );
  t.assert(t.text(aside).length > 10, 'Врезка пустая — в ней должны быть цифры из письма редактора.');

  var note = t.$('main section');
  t.assert(
    note,
    'Примечания редакции в <section> нет. Слова редактора о том, почему статью написали именно сейчас, имеют смысл только на этой странице — это <section>, а не <aside> и не <article>.',
  );
  t.assert(
    note.tagName.toLowerCase() !== 'article',
    'Примечание редакции оказалось в <article>. Унеси его на другой сайт — оно потеряет смысл: «мы трижды ошибались» без контекста этой газеты не значит ничего.',
  );

  t.assert(
    t.count('article aside') === 0 && t.count('aside article') === 0,
    'Врезка и статья вложены друг в друга. Это два соседних, а не один внутри другого.',
  );
  return 'Врезка и примечание на своих местах';
});
