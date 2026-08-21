check('landmarks', 'Страница разложена на части', function (t) {
  var missing = [];
  if (!t.$('header')) missing.push('<header>');
  if (!t.$('main')) missing.push('<main>');
  if (!t.$('footer')) missing.push('<footer>');

  t.assert(
    missing.length === 0,
    'Не хватает частей страницы: ' +
      missing.join(', ') +
      '. Шапка, основное содержимое и подвал — три опоры, на которых держится любая страница.',
  );
  return 'Шапка, основная часть и подвал на месте';
});

check('single-h1', 'Главный заголовок один', function (t) {
  var count = t.count('h1');
  t.assert(count > 0, 'Заголовка <h1> нет. Он отвечает на вопрос «что это за страница» — здесь это пропавший кот.');
  t.assert(
    count === 1,
    'Заголовков <h1> на странице: ' +
      count +
      '. Главная мысль у страницы одна, поэтому и <h1> должен быть один — остальные заголовки делай через <h2>.',
  );
  return 'Заголовок страницы: «' + t.text('h1') + '»';
});

check('heading-order', 'Заголовки идут по порядку', function (t) {
  var headings = t.$$('h1, h2, h3, h4, h5, h6');
  var previous = 0;

  for (var i = 0; i < headings.length; i++) {
    var level = Number(headings[i].tagName.slice(1));
    if (previous !== 0 && level > previous + 1) {
      t.fail(
        'После <h' +
          previous +
          '> сразу идёт <h' +
          level +
          '> («' +
          t.text(headings[i]) +
          '»). Уровни заголовков — это оглавление страницы, и в нём нельзя перепрыгивать ступеньку.',
      );
    }
    previous = level;
  }

  return 'Заголовков: ' + headings.length + ', порядок не нарушен';
});

check('features-list', 'Приметы перечислены списком', function (t) {
  var lists = t.$$('ul, ol');
  t.assert(
    lists.length > 0,
    'Списка на странице нет. Приметы кота — это перечисление, и браузеру о нём надо сказать тегом <ul>, а не запятыми в абзаце.',
  );

  var biggest = 0;
  for (var i = 0; i < lists.length; i++) {
    biggest = Math.max(biggest, lists[i].querySelectorAll('li').length);
  }

  t.assert(
    biggest >= 3,
    'В самом длинном списке пунктов: ' + biggest + '. Примет в объявлении четыре — перечисли хотя бы три.',
  );
  return 'Пунктов в списке примет: ' + biggest;
});

check('photo', 'Фотография с описанием', function (t) {
  var image = t.$('img');
  t.assert(image, 'Фотографии нет. Файл cat.svg лежит рядом с index.html.');

  var alt = t.normalize(t.attr(image, 'alt') || '');
  t.assert(alt.length > 0, 'У картинки нет alt. По объявлению кота будут искать в том числе люди, которые её не увидят.');
  t.assert(
    alt.split(' ').length >= 3,
    'Описание «' + alt + '» слишком короткое. Опиши кота так, чтобы по этим словам его можно было узнать.',
  );
  return 'Кот описан словами: «' + alt + '»';
});

check('map-link', 'Ссылка на карту открывается в новой вкладке', function (t) {
  var links = t.$$('a[href]');
  var external = null;

  for (var i = 0; i < links.length; i++) {
    if ((t.attr(links[i], 'href') || '').indexOf('https://') === 0) external = links[i];
  }

  t.assert(external, 'Ссылки на карту нет. Адрес есть в описании задания, и он начинается с https://');
  t.assert(
    t.text(external).length >= 4,
    'У ссылки нет понятного текста. Человек должен понимать, куда он попадёт, ещё до нажатия.',
  );
  t.assert(
    t.attr(external, 'target') === '_blank',
    'Ссылка на карту уведёт человека с объявления, и телефон он уже не увидит. Открой её в новой вкладке через target="_blank".',
  );
  return 'Карта откроется рядом, объявление останется';
});

check('grouping', 'Разделы отделены друг от друга', function (t) {
  var groups = t.count('main section, main article');
  t.assert(
    groups > 0,
    'Внутри <main> всё лежит одной кучей. Приметы и «где пропал» — два разных раздела, каждый стоит завернуть в <section>.',
  );
  t.assert(
    groups >= 2,
    'Разделов внутри <main>: ' + groups + '. Их два: приметы и место пропажи.',
  );
  return 'Разделов внутри main: ' + groups;
});
