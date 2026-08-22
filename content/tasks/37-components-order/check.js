var EXPECTED = ['header', 'hero', 'features', 'reviews', 'footer'];

var NAMES = {
  header: 'шапка',
  hero: 'первый экран',
  features: 'преимущества',
  reviews: 'отзывы',
  footer: 'подвал'
};

function currentOrder(t) {
  return t.$$('[data-block]').map(function (node) {
    return node.getAttribute('data-block');
  });
}

check('all-blocks', 'На странице все пять блоков', function (t) {
  var order = currentOrder(t);
  var missing = EXPECTED.filter(function (id) {
    return order.indexOf(id) === -1;
  }).map(function (id) {
    return NAMES[id];
  });
  t.assert(order.length > 0, 'Страница пустая — перетащи блоки в правую колонку.');
  t.assert(missing.length === 0, 'Не хватает блоков: ' + missing.join(', ') + '.');
  return 'Все блоки на месте';
});

check('order', 'Блоки стоят в правильном порядке', function (t) {
  var order = currentOrder(t);
  for (var i = 0; i < EXPECTED.length; i++) {
    if (order[i] !== EXPECTED[i]) {
      t.fail(
        'На позиции ' + (i + 1) + ' стоит «' + (NAMES[order[i]] || '—') +
          '», а ожидается «' + NAMES[EXPECTED[i]] + '».'
      );
    }
  }
  return 'Порядок как надо';
});

check('semantic-tags', 'Шапка и подвал используют свои теги', function (t) {
  var header = t.$('[data-block="header"]');
  var footer = t.$('[data-block="footer"]');
  t.assert(header && header.tagName.toLowerCase() === 'header', 'Блок шапки должен быть тегом <header>.');
  t.assert(footer && footer.tagName.toLowerCase() === 'footer', 'Блок подвала должен быть тегом <footer>.');
  return 'Смысловые теги на месте';
});
