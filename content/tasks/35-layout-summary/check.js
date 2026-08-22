/*
  Итог главы. Каждая проверка названа умением, а сообщение об ошибке
  отправляет к тому заданию, где это умение появилось.
*/
var BLOCKS = ['section--hero', 'section--about', 'section--services', 'section--pricing', 'section--cta'];

var BLOCK_NAMES = {
  'section--hero': 'первый экран',
  'section--about': 'о студии',
  'section--services': 'занятия',
  'section--pricing': 'цены',
  'section--cta': 'финальный экран',
};

function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css — он подключён из index.html, эту строку не трогай.');
  return node.textContent || '';
}

check('page-order', 'Страница собрана по порядку', function (t) {
  var order = t.$$('.section').map(function (el) {
    var names = String(el.className).split(' ');
    for (var i = 0; i < names.length; i++) {
      if (BLOCKS.indexOf(names[i]) !== -1) return names[i];
    }
    return '';
  });

  t.assert(order.length === BLOCKS.length, 'Блоков на странице: ' + order.length + ', а должно быть пять.');

  for (var i = 0; i < BLOCKS.length; i++) {
    if (order[i] === BLOCKS[i]) continue;
    t.fail(
      'На месте ' +
        (i + 1) +
        ' стоит «' +
        (BLOCK_NAMES[order[i]] || '—') +
        '», а ожидается «' +
        BLOCK_NAMES[BLOCKS[i]] +
        '». Страница ведёт человека теми же шагами, что и первый экран: сначала желаемое, потом кто вы, потом что предлагаете, потом сколько это стоит, и только в конце — действие.',
    );
  }
  return 'Пять блоков в нужном порядке';
});

check('single-h1', 'Главный заголовок на странице один', function (t) {
  var count = t.count('h1');
  t.assert(count > 0, 'Заголовка <h1> нет. Он отвечает на вопрос, о чём эта страница.');
  t.assert(
    count === 1,
    'Заголовков <h1> на странице: ' +
      count +
      '. Страница про одно, поэтому и главный заголовок один — остальные блоки открываются через <h2>.',
  );
  return 'Заголовок один';
});

check('scale', 'Иерархия держится на контрасте масштаба', function (t) {
  var scale = t.layout.fontScale('.hero__title', '.hero__proof');
  t.assert(scale > 0, 'Не удалось прочитать размеры шрифта.');
  t.assert(
    scale >= 2.5,
    'Заголовок крупнее текста в ' +
      scale.toFixed(1) +
      ' раза, а нужно от 2.5. Это было в задании «Иерархия и контраст масштаба».',
  );
  return 'Контраст ' + scale.toFixed(1) + ' раза';
});

check('rhythm', 'Все отступы держат общий шаг', function (t) {
  var css = source(t).replace(/\/\*[\s\S]*?\*\//g, '');
  var declarations = css.match(/(?:^|[;{])\s*(?:padding|margin|gap|row-gap|column-gap)[a-z-]*\s*:[^;}]+/gi) || [];

  for (var i = 0; i < declarations.length; i++) {
    var line = declarations[i].replace(/^[;{\s]+/, '').trim();
    var numbers = line.split(':')[1].match(/(\d+(?:\.\d+)?)px/g) || [];
    for (var j = 0; j < numbers.length; j++) {
      var value = parseFloat(numbers[j]);
      if (value === 0 || value % 8 === 0) continue;
      t.fail(
        'Отступ ' +
          value +
          'px выпадает из шага в 8 пикселей: «' +
          line +
          '». Это было в задании «Сетка и визуальная грамматика».',
      );
    }
  }
  return 'Ритм выдержан';
});

check.browser('page-spine', 'Через страницу проходит одна струна', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  // Финальный экран центрирован намеренно — он в общую струну не входит.
  var edges = [];
  ['.section--hero', '.section--about', '.section--services', '.section--pricing'].forEach(function (selector) {
    var block = t.$(selector);
    if (!block) return;
    var rect = t.rect(block);
    var padding = parseFloat(t.style(block, 'padding-left')) || 0;
    edges.push(Math.round(rect.left + padding));
  });

  t.assert(edges.length === 4, 'Не нашёл блоки страницы.');
  var spread = t.layout.spread(edges);
  t.assert(
    spread <= 2,
    'Левый край блоков гуляет по странице: ' +
      edges.join('px, ') +
      'px — разброс ' +
      Math.round(spread) +
      'px. Струна из задания «Невидимая струна» работает и на уровне страницы: у всех блоков должна быть одна ширина и одни поля.',
  );
  return 'Струна проходит насквозь';
});

check.browser('vertical-rhythm', 'Между блоками один вертикальный шаг', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var blocks = t.layout.rects('.section');
  t.assert(blocks.length === 5, 'Блоков на странице: ' + blocks.length + '.');

  var gaps = [];
  for (var i = 1; i < blocks.length; i++) {
    gaps.push(Math.round(blocks[i].top - blocks[i - 1].bottom));
  }

  var spread = t.layout.spread(gaps);
  t.assert(
    spread <= 4,
    'Расстояния между блоками разные: ' +
      gaps.join('px, ') +
      'px. Повторение читается как порядок, а случайные числа — как небрежность: вертикальный шаг у страницы должен быть один.',
  );
  return 'Шаг между блоками ' + gaps[0] + 'px';
});
