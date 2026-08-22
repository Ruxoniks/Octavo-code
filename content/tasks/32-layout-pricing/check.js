/*
  «Выделить цветом» видно только в исходнике: по вычисленным стилям не понять,
  выделили тариф намеренно или он таким уродился. Поэтому главная проверка
  этого задания читает текст файла.
*/
function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css — он подключён из index.html, эту строку не трогай.');
  return node.textContent || '';
}

/** Правила, которые относятся именно к выделенному тарифу. */
function featuredRules(t) {
  var rules = source(t).match(/\.plan--featured[^{]*\{[\s\S]*?\}/g) || [];
  return rules.join('\n');
}

check('not-by-colour', 'Тариф выделен не цветом', function (t) {
  var rules = featuredRules(t);
  var paint = rules.match(/(?:^|[;{])\s*(?:background|background-color|color)\s*:[^;}]+/gi) || [];
  // Сообщение собирается до вызова assert, поэтому обращаться к paint[0]
  // можно только когда он точно есть.
  var offender = paint.length ? paint[0].replace(/^[;{\s]+/, '').trim() : '';

  t.assert(
    paint.length === 0,
    'Выделенный тариф залит краской: «' +
      offender +
      '». Цвет — самый громкий и самый дешёвый способ выделения: он кричит, но ничего не объясняет, ломает единство блока и исчезает на чёрно-белой печати. Выделять надо тем, что работает всегда: размером и воздухом.',
  );
  return 'Краска не понадобилась';
});

check('more-air', 'У выделенного тарифа больше воздуха', function (t) {
  var featured = parseFloat(t.style('.plan--featured', 'padding-top')) || 0;
  var plain = parseFloat(t.style('.pricing__grid .plan:not(.plan--featured)', 'padding-top')) || 0;

  t.assert(featured > 0 && plain > 0, 'Не удалось прочитать поля карточек.');
  t.assert(
    featured > plain,
    'Поля у всех тарифов одинаковые (' +
      Math.round(featured) +
      'px). Пустота вокруг — это и есть акцент: чем просторнее карточка, тем важнее она выглядит, даже когда написано в ней то же самое.',
  );
  return 'Воздуха ' + Math.round(featured) + 'px против ' + Math.round(plain) + 'px';
});

check('bigger-price', 'Цена выделенного тарифа крупнее', function (t) {
  var scale = t.layout.fontScale('.plan--featured .plan__price', '.plan:not(.plan--featured) .plan__price');
  t.assert(scale > 0, 'Не удалось прочитать размеры цены.');
  t.assert(
    scale >= 1.3,
    'Цена выделенного тарифа крупнее остальных всего в ' +
      scale.toFixed(2) +
      ' раза. Среди равных выигрывает тот, чья разница заметна боковым зрением, — а такую глаз не поймает.',
  );
  return 'Цена крупнее в ' + scale.toFixed(2) + ' раза';
});

check('three-columns', 'Тарифы стоят рядом и сравнимы', function (t) {
  var columns = t.layout.columnCount(t.style('.pricing__grid', 'grid-template-columns'));
  t.assert(
    columns === 3,
    'Колонок в сетке: ' + columns + '. Тарифы сравнивают взглядом, а для этого они должны стоять рядом.',
  );
  return 'Три колонки';
});

check.browser('same-top', 'Карточки начинаются от одной линии', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var tops = t.layout.rects('.plan').map(function (r) {
    return Math.round(r.top);
  });
  t.assert(tops.length === 3, 'Тарифов должно быть три, нашёл ' + tops.length + '.');

  t.assert(
    t.layout.spread(tops) <= 2,
    'Карточки начинаются на разной высоте: ' +
      tops.join('px, ') +
      'px. Выделенный тариф должен выигрывать размером, а не съезжать вниз — иначе сравнивать их глазом станет неудобно.',
  );
  return 'Верхняя линия общая';
});
