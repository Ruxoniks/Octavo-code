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

check('aside-exists', 'Колонка редактора написана', function (t) {
  var aside = t.$('aside');
  t.assert(
    aside,
    'Тега <aside> на странице нет. Колонку редактора нужно написать самому: она связана с новостями косвенно — убери её, и полоса не пострадает. Это и есть <aside>.',
  );
  t.assert(
    aside.querySelector('h1, h2, h3, h4, h5, h6'),
    'У врезки нет заголовка. Раздел без заголовка нельзя назвать — ни человеку, ни программе чтения: непонятно, что это за колонка сбоку.',
  );

  var text = t.text(aside);
  t.assert(
    text.length > 60,
    'Во врезке всего ' + text.length + ' символов. Редактору нужны две-три живые строки, а не заголовок с пустотой под ним.',
  );
  t.assert(
    text.toLowerCase().indexOf('мост') !== -1,
    'Врезка не про мост. Колонка редактора в этом выпуске — про то, что мост наконец достроили, хотя редакция трижды обещала это раньше.',
  );
  return 'Врезка написана: символов ' + text.length;
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
