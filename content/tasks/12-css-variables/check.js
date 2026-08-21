function sameColor(t, a, b) {
  var first = t.parseColor(a);
  var second = t.parseColor(b);
  if (!first || !second) return false;
  return first[0] === second[0] && first[1] === second[1] && first[2] === second[2];
}

check('brand-declared', 'Переменная --brand объявлена в :root', function (t) {
  return t.expectStyle(
    ':root',
    '--brand',
    function (value) {
      return value.length > 0;
    },
    'Не вижу --brand в :root. Переменная объявляется так: :root { --brand: #1a7f37; }'
  );
});

check('surface-declared', 'Переменная --surface объявлена в :root', function (t) {
  return t.expectStyle(
    ':root',
    '--surface',
    function (value) {
      return value.length > 0;
    },
    'Не вижу --surface в :root'
  );
});

check('h1-uses-brand', 'Заголовок берёт цвет из --brand', function (t) {
  var brand = t.style(':root', '--brand');
  if (!brand) return t.skip('Переменные не вычисляются в этой среде');
  var color = t.style('h1', 'color');
  t.assert(
    sameColor(t, brand, color),
    'Цвет заголовка (' + color + ') не совпадает с --brand (' + brand + '). Подставь var(--brand).'
  );
  return 'Заголовок использует --brand';
});

check('btn-uses-brand', 'Кнопка берёт фон из --brand', function (t) {
  var brand = t.style(':root', '--brand');
  if (!brand) return t.skip('Переменные не вычисляются в этой среде');
  var background = t.style('.btn', 'background-color');
  t.assert(
    sameColor(t, brand, background),
    'Фон кнопки (' + background + ') не совпадает с --brand (' + brand + ').'
  );
  return 'Кнопка использует --brand';
});

check('card-uses-surface', 'Карточка берёт фон из --surface', function (t) {
  var surface = t.style(':root', '--surface');
  if (!surface) return t.skip('Переменные не вычисляются в этой среде');
  var background = t.style('.card', 'background-color');
  t.assert(
    sameColor(t, surface, background),
    'Фон карточки (' + background + ') не совпадает с --surface (' + surface + ').'
  );
  return 'Карточка использует --surface';
});
