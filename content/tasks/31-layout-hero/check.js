/*
  Первый экран целиком. Порядок, масштаб и ритм видно по разметке и стилям,
  поэтому они проверяются везде; струна и точка притяжения — только в браузере.
*/
var STEPS = ['hero__title', 'hero__solution', 'hero__proof', 'hero__action'];

var STEP_NAMES = {
  hero__title: 'заголовок',
  hero__solution: 'как это устроено',
  hero__proof: 'доказательства',
  hero__action: 'кнопка',
};

function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css — он подключён из index.html, эту строку не трогай.');
  return node.textContent || '';
}

check('reading-order', 'Пять шагов идут в порядке чтения', function (t) {
  var text = t.$('.hero__text');
  t.assert(text, 'Не нашёл .hero__text — не меняй классы, только порядок элементов.');

  var order = [];
  for (var i = 0; i < text.children.length; i++) {
    var name = String(text.children[i].className).split(' ')[0];
    if (STEPS.indexOf(name) !== -1) order.push(name);
  }

  t.assert(
    order.length === STEPS.length,
    'В колонке должно остаться четыре блока текста, нашёл ' + order.length + '.',
  );

  for (var j = 0; j < STEPS.length; j++) {
    if (order[j] === STEPS[j]) continue;
    t.fail(
      'На месте ' +
        (j + 1) +
        ' стоит «' +
        STEP_NAMES[order[j]] +
        '», а должен быть «' +
        STEP_NAMES[STEPS[j]] +
        '». Человек читает сверху вниз: сначала желаемое, потом как это устроено, потом доказательства и только в конце — действие.',
    );
  }
  return 'Порядок шагов верный';
});

check('two-columns', 'Экран разложен на две колонки', function (t) {
  var display = t.style('.hero', 'display');
  t.assert(display, 'Не нашёл .hero — не меняй классы в разметке.');
  t.assert(
    display === 'flex' || display === 'grid',
    'Текст и картинка идут друг под другом (display: ' + display + '). Асимметрия начинается с двух колонок.',
  );

  var align = t.style('.hero__text', 'text-align');
  t.assert(align !== 'center', 'Текст выровнен по центру — у строк снова разные левые края.');
  return 'Две колонки, текст по левому краю';
});

check('scale', 'Иерархия построена на контрасте масштаба', function (t) {
  var scale = t.layout.fontScale('.hero__title', '.hero__proof');
  t.assert(scale > 0, 'Не удалось прочитать размеры шрифта.');
  t.assert(
    scale >= 2.5,
    'Заголовок крупнее текста в ' +
      scale.toFixed(1) +
      ' раза. Глаз считает иерархию боковым зрением, и такой разницы ему мало — нужно от 2.5.',
  );

  var heading = t.layout.lineHeight('.hero__title');
  t.assert(
    heading === null || heading <= 1.25,
    'Межстрочный интервал заголовка ' +
      (heading || 0).toFixed(2) +
      ' — для крупного кегля слишком просторно, нужно около 1.1.',
  );
  return 'Контраст ' + scale.toFixed(1) + ' раза';
});

check('rhythm', 'Отступы держат общий шаг', function (t) {
  var css = source(t).replace(/\/\*[\s\S]*?\*\//g, '');
  var declarations = css.match(/(?:^|[;{])\s*(?:padding|margin|gap|row-gap|column-gap)[a-z-]*\s*:[^;}]+/gi) || [];
  t.assert(declarations.length > 0, 'В файле нет ни одного отступа — экран собран без ритма.');

  for (var i = 0; i < declarations.length; i++) {
    var line = declarations[i].replace(/^[;{\s]+/, '').trim();
    var numbers = line.split(':')[1].match(/(\d+(?:\.\d+)?)px/g) || [];
    for (var j = 0; j < numbers.length; j++) {
      var value = parseFloat(numbers[j]);
      if (value === 0 || value % 8 === 0) continue;
      t.fail('Отступ ' + value + 'px выпадает из шага в 8 пикселей: «' + line + '».');
    }
  }
  return 'Ритм выдержан';
});

check.browser('spine', 'У текста единая струна', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var edges = t.layout.leftEdges('.hero__title, .hero__solution, .hero__proof');
  edges.push(t.rect('.hero__action').left);

  var spread = t.layout.spread(edges);
  t.assert(
    spread <= 2,
    'Левые края разъехались на ' + Math.round(spread) + 'px. Вся колонка должна стоять на одной линии.',
  );
  return 'Струна натянута';
});

check.browser('focal', 'Картинка работает точкой притяжения', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var share = t.layout.areaShare('.hero__media', '.hero');
  t.assert(
    share >= 0.22,
    'Картинка занимает ' + Math.round(share * 100) + '% экрана — этого мало, чтобы поймать взгляд первой.',
  );

  var media = t.rect('.hero__media');
  var text = t.rect('.hero__text');
  t.assert(media.left >= text.right - 1, 'Картинка не ушла в свою колонку.');
  return 'Точка притяжения занимает ' + Math.round(share * 100) + '%';
});

check.browser('air', 'У экрана есть поля', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var padding = parseFloat(t.style('.hero', 'padding-top')) || 0;
  t.assert(
    padding >= 32,
    'Поле сверху ' + Math.round(padding) + 'px — первый экран прижат к краю окна и выглядит обрезанным.',
  );
  return 'Поля на месте';
});
