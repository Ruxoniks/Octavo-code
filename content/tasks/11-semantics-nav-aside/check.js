check('nav-exists', 'Меню названо навигацией', function (t) {
  var nav = t.$('header nav');
  t.assert(
    t.$('nav'),
    'Тега <nav> на странице нет. Набор ссылок в шапке — это меню, и человек, который слушает страницу, должен иметь возможность его пропустить.',
  );
  t.assert(
    nav,
    'Тег <nav> есть, но лежит не в шапке. Меню газеты — часть <header>: там же, где название.',
  );
  t.assert(
    nav.querySelectorAll('a').length >= 3,
    'Ссылок внутри <nav>: ' + nav.querySelectorAll('a').length + '. В меню их три — заверни все.',
  );
  return 'Меню: ссылок ' + nav.querySelectorAll('a').length;
});

check('anchors-lead-somewhere', 'Ссылки ведут к разделам', function (t) {
  var links = t.$$('nav a');
  t.assert(links.length > 0, 'В <nav> нет ссылок.');

  var broken = [];
  for (var i = 0; i < links.length; i++) {
    var href = t.attr(links[i], 'href') || '';
    if (href === '#' || href === '') {
      broken.push('«' + t.text(links[i]) + '» ведёт в никуда');
      continue;
    }
    if (href.charAt(0) === '#' && !t.$(href)) {
      broken.push('«' + t.text(links[i]) + '» ищет ' + href + ', а такого раздела на странице нет');
    }
  }

  t.assert(
    broken.length === 0,
    'Сломанная ссылка: ' + broken[0] + '. Якорь href="#novosti" находит элемент с id="novosti" — сверь имена.',
  );
  return 'Все ' + links.length + ' ссылки находят свой раздел';
});

check('aside-exists', 'Колонка редактора стала врезкой', function (t) {
  var aside = t.$('aside');
  t.assert(
    aside,
    'Тега <aside> на странице нет. Колонка редактора связана с новостями косвенно: убери её — полоса не пострадает. Это и есть <aside>.',
  );
  t.assert(
    t.text(aside).length > 20,
    'Врезка пустая. Обернуть нужно колонку редактора вместе с её заголовком и текстом.',
  );
  t.assert(
    t.count('div.column') === 0,
    'Остался <div class="column">. Похоже, добавлена новая обёртка, а старая на месте — тег нужно именно заменить.',
  );
  return 'Врезка на месте';
});

check('aside-not-in-nav', 'Врезка не попала в меню', function (t) {
  t.assert(
    t.count('nav aside') === 0,
    'Врезка оказалась внутри <nav>. Тогда программа чтения объявит колонку редактора частью меню и предложит её пропустить вместе со ссылками.',
  );
  t.assert(
    t.count('aside nav') === 0,
    'Меню оказалось внутри <aside>. Навигация газеты — не боковая заметка, ей место в шапке.',
  );
  return 'Меню и врезка не путаются';
});
