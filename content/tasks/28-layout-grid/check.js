/*
  Сетка проверяется двумя разными способами. Колонки объявлены в стилях —
  это видно везде. А вот встали ли карточки в ряд на самом деле, знает
  только браузер: в тестовой среде раскладки нет.
*/
var STEP = 8;

function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css — он подключён из index.html, эту строку не трогай.');
  return node.textContent || '';
}

check('grid-declared', 'Карточки разложены сеткой на три колонки', function (t) {
  var display = t.style('.services__grid', 'display');
  t.assert(display, 'Не нашёл .services__grid — не меняй классы в разметке.');
  t.assert(
    display === 'grid',
    'Карточки идут друг под другом (display: ' +
      display +
      '). Сетка включается одной строкой: display: grid у контейнера.',
  );

  var columns = t.layout.columnCount(t.style('.services__grid', 'grid-template-columns'));
  t.assert(
    columns > 0,
    'Сетка есть, но колонки не объявлены. Их задаёт grid-template-columns — например, repeat(3, 1fr).',
  );
  t.assert(
    columns === 3,
    'Колонок в сетке: ' + columns + ', а занятий три. Каждой карточке — своя колонка.',
  );
  return 'Сетка из трёх колонок';
});

check('rhythm', 'Все отступы попадают в общий шаг', function (t) {
  var css = source(t).replace(/\/\*[\s\S]*?\*\//g, '');
  var declarations = css.match(/(?:^|[;{])\s*(?:padding|margin|gap|row-gap|column-gap)[a-z-]*\s*:[^;}]+/gi) || [];
  t.assert(declarations.length > 0, 'В файле нет ни одного отступа.');

  for (var i = 0; i < declarations.length; i++) {
    var text = declarations[i].replace(/^[;{\s]+/, '').trim();
    var numbers = text.split(':')[1].match(/(\d+(?:\.\d+)?)px/g) || [];

    for (var j = 0; j < numbers.length; j++) {
      var value = parseFloat(numbers[j]);
      if (value === 0 || value % STEP === 0) continue;

      var lower = Math.floor(value / STEP) * STEP;
      var upper = lower + STEP;
      var closest = value - lower < upper - value ? lower : upper;

      t.fail(
        'Отступ ' +
          value +
          'px выпадает из ритма: «' +
          text +
          '». Шаг сетки — ' +
          STEP +
          ' пикселей, а число, которого никто не выбирал, ломает грамматику так же, как опечатка ломает слово. Ближайшее подходящее — ' +
          closest +
          'px.',
      );
    }
  }

  return 'Все отступы кратны ' + STEP + 'px';
});

check.browser('cards-in-row', 'Карточки действительно встали в ряд', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var cards = t.layout.rects('.card');
  t.assert(cards.length === 3, 'Карточек на странице: ' + cards.length + ', а должно быть три.');

  var tops = cards.map(function (r) {
    return Math.round(r.top);
  });
  t.assert(
    t.layout.spread(tops) <= 2,
    'Карточки стоят на разной высоте: ' + tops.join('px, ') + 'px. В ряду они должны начинаться от одной линии.',
  );

  var widths = cards.map(function (r) {
    return Math.round(r.width);
  });
  t.assert(
    t.layout.spread(widths) <= 4,
    'Ширина колонок разъехалась: ' +
      widths.join('px, ') +
      'px. Доли 1fr делят свободное место поровну — колонки должны получиться одинаковыми.',
  );

  return 'Три колонки по ' + widths[0] + 'px';
});

check.browser('inner-spine', 'Внутри карточки тот же левый край', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var first = t.$('.card');
  t.assert(first, 'Не нашёл карточку.');

  var edges = [];
  ['.card__title', '.card__text', '.card__meta'].forEach(function (selector) {
    var el = first.querySelector(selector);
    if (!el) return;
    var lines = t.layout.lines(el);
    edges.push(lines.length ? lines[0].left : t.rect(el).left);
  });

  t.assert(edges.length >= 2, 'Не нашёл содержимое карточки.');
  var spread = t.layout.spread(edges);
  t.assert(
    spread <= 2,
    'Внутри карточки края разъехались на ' +
      Math.round(spread) +
      'px. Композиция рекурсивна: те же правила, что держат страницу, действуют и внутри каждого её кусочка.',
  );
  return 'Внутри карточки край единый';
});
