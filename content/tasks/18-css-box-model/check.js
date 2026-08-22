function px(value) {
  return parseFloat(String(value).replace('px', '')) || 0;
}

check('padding', 'У карточек есть внутренние отступы', function (t) {
  t.assert(t.count('.card') >= 2, 'В разметке должно быть минимум две карточки .card');
  return t.expectStyle(
    '.card',
    'padding-top',
    function (value) {
      return px(value) >= 16;
    },
    'padding меньше 16px — текст прижат к рамке'
  );
});

check('border', 'У карточек есть рамка', function (t) {
  return t.expectStyle(
    '.card',
    'border-top-width',
    function (value) {
      return px(value) >= 1;
    },
    'Рамки нет. Добавь border: 1px solid #e4d9c6;'
  );
});

check('radius', 'Углы скруглены', function (t) {
  return t.expectStyle(
    '.card',
    'border-top-left-radius',
    function (value) {
      return px(value) >= 8;
    },
    'border-radius меньше 8px'
  );
});

check('gap-between', 'Карточки не слипаются', function (t) {
  return t.expectStyle(
    '.card',
    'margin-bottom',
    function (value) {
      return px(value) >= 8;
    },
    'Между карточками нет внешнего отступа — добавь margin-bottom'
  );
});

check.browser('really-spaced', 'На экране между карточками есть промежуток', function (t) {
  var cards = t.$$('.card');
  t.assert(cards.length >= 2, 'Нужно минимум две карточки.');
  var first = t.rect(cards[0]);
  var second = t.rect(cards[1]);
  var distance = second.top - first.bottom;
  t.assert(
    distance >= 8,
    'Расстояние между карточками ' + Math.round(distance) + 'px. Похоже, отступ задан, но его перебивает другое правило.'
  );
  return 'Промежуток: ' + Math.round(distance) + 'px';
});
