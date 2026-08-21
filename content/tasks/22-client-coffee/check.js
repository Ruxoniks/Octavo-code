check('title', 'Название кофейни в <h1>', function (t) {
  var h1 = t.$('h1');
  t.assert(h1, 'На странице нет заголовка <h1>.');
  var text = t.text(h1).toLowerCase();
  t.assert(
    text.indexOf('курсор') !== -1,
    'В заголовке «' + t.text(h1) + '» не видно названия кофейни «Ленивый курсор».'
  );
  return 'Название на месте';
});

check('hours', 'Видно время работы', function (t) {
  var text = t.text(t.$('body'));
  t.assert(
    /\d{1,2}[:.]\d{2}/.test(text),
    'Не нашёл на странице времени работы. Марина просила его в первую очередь — например, «с 8:00 до 22:00».'
  );
  return 'Время работы указано';
});

check('benefits', 'Три причины зайти', function (t) {
  var blocks = t.$$('.benefit, main li');
  var filled = blocks.filter(function (node) {
    return t.text(node).length >= 5;
  });
  t.assert(
    filled.length >= 3,
    'Нашёл причин: ' + filled.length + '. Нужно три — карточками с классом benefit или пунктами списка внутри <main>.'
  );
  return 'Причин: ' + filled.length;
});

check('phone', 'По телефону можно позвонить', function (t) {
  var link = t.$('a[href^="tel:"]');
  t.assert(link, 'Телефон не оформлен ссылкой. Нужен <a href="tel:+7…">, чтобы с телефона нажать и позвонить.');
  var digits = (t.attr(link, 'href') || '').replace(/\D/g, '');
  t.assert(digits.length >= 10, 'В номере «' + t.attr(link, 'href') + '» маловато цифр.');
  var footer = t.$('footer');
  t.assert(footer && footer.querySelector('a[href^="tel:"]'), 'Марина просила телефон внизу — положи ссылку в <footer>.');
  return 'Телефон кликабельный и в подвале';
});

check('map-link', 'Есть ссылка на карту', function (t) {
  var links = t.$$('a[href^="https://"]');
  var map = links.filter(function (link) {
    var href = (link.getAttribute('href') || '').toLowerCase();
    var text = t.text(link).toLowerCase();
    return href.indexOf('map') !== -1 || href.indexOf('yandex') !== -1 || text.indexOf('карт') !== -1;
  });
  t.assert(map.length > 0, 'Ссылки на карту нет. Подойдёт любая внешняя ссылка с понятным текстом вроде «Мы на карте».');
  return 'Ссылка на карту есть';
});

check('phone-size', 'Телефон крупнее обычного текста', function (t) {
  t.assert(t.$('footer a[href^="tel:"]'), 'Сначала добавь телефон ссылкой в подвал.');
  return t.expectStyle(
    'footer a[href^="tel:"]',
    'font-size',
    function (value) {
      return parseFloat(value) >= 18;
    },
    'Телефон всё ещё мелкий — Марина просила покрупнее'
  );
});

check('book-button', 'Кнопка «Забронировать стол»', function (t) {
  var candidates = t.$$('a, button').filter(function (node) {
    return t.text(node).toLowerCase().indexOf('забронировать') !== -1;
  });
  t.assert(candidates.length > 0, 'Кнопки с текстом «Забронировать стол» на странице нет.');

  var button = candidates[0];
  var background = t.style(button, 'background-color');
  if (!background) return t.skip('Кнопка есть, цвет в этой среде не вычисляется');

  var rgb = t.parseColor(background);
  t.assert(rgb !== null, 'Не смог разобрать цвет кнопки: ' + background);
  // Сливовый — это когда красного и синего заметно больше, чем зелёного.
  t.assert(
    rgb[0] > rgb[1] && rgb[2] > rgb[1],
    'Кнопка не выглядит сливовой (' + background + '). Марина просила цвет вывески — что-то вроде #5f3f54.'
  );
  return 'Кнопка на месте и сливовая';
});
