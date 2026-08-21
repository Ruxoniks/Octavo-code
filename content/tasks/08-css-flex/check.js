function px(value) {
  return parseFloat(String(value).replace('px', '')) || 0;
}

check('display-flex', 'Контейнер .row стал flex', function (t) {
  t.assert(t.$('.row'), 'В разметке нет блока .row');
  return t.expectStyle(
    '.row',
    'display',
    'flex',
    'Контейнер .row пока не flex — добавь display: flex'
  );
});

check('gap', 'Между карточками задан gap', function (t) {
  return t.expectStyle(
    '.row',
    'column-gap',
    function (value) {
      return px(value) >= 12;
    },
    'gap меньше 12px — карточки почти слиплись'
  );
});

check.browser('same-line', 'Карточки стоят в одну строку', function (t) {
  var cards = t.$$('.row .card');
  t.assert(cards.length >= 3, 'Ожидал три карточки внутри .row');
  var tops = cards.map(function (card) {
    return Math.round(t.rect(card).top);
  });
  var min = Math.min.apply(null, tops);
  var max = Math.max.apply(null, tops);
  t.assert(
    max - min <= 2,
    'Карточки на разной высоте — значит, они всё ещё идут друг под другом, а не в ряд.'
  );
  return 'Все три на одной линии';
});

check.browser('equal-width', 'Карточки одинаковой ширины', function (t) {
  var widths = t.$$('.row .card').map(function (card) {
    return Math.round(t.rect(card).width);
  });
  var min = Math.min.apply(null, widths);
  var max = Math.max.apply(null, widths);
  t.assert(
    max - min <= 4,
    'Ширины разные: ' + widths.join(', ') + 'px. Добавь карточкам flex: 1, чтобы они делили место поровну.'
  );
  return 'Ширина каждой: ' + min + 'px';
});
