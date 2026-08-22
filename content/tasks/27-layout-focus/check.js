/*
  Размер точки притяжения виден только по настоящей раскладке, поэтому доля
  площади и верхняя линия — браузерные. Но два рычага, которыми ученик этого
  добивается, читаются из стилей и работают везде.
*/
function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css — он подключён из index.html, эту строку не трогай.');
  return node.textContent || '';
}

check('top-aligned', 'Картинка и заголовок начинаются на одной высоте', function (t) {
  var align = t.style('.pitch', 'align-items');
  t.assert(align, 'Не нашёл блок .pitch — не меняй классы в разметке.');
  t.assert(
    align === 'flex-start',
    'Колонки выровнены по центру (align-items: ' +
      align +
      '). Пока это так, верх картинки и верх заголовка стоят на разной высоте, и между ними нет общей линии.',
  );
  return 'Верхняя линия общая';
});

check('media-not-fixed', 'Размер картинки задан долей, а не пикселями', function (t) {
  var rules = source(t).match(/\.pitch__media\s*\{[\s\S]*?\}/g) || [];
  t.assert(rules.length > 0, 'Правила для .pitch__media нет — картинка не оформлена.');

  var widths = rules.join('\n').match(/(?:^|[;{])\s*width\s*:[^;}]+/gi) || [];
  t.assert(widths.length > 0, 'У картинки не задана ширина.');

  for (var i = 0; i < widths.length; i++) {
    var value = widths[i].split(':')[1];
    t.assert(
      !/\d\s*px/i.test(value),
      'Ширина картинки задана в пикселях: «' +
        widths[i].replace(/^[;{\s]+/, '').trim() +
        '». Точка притяжения должна занимать свою долю экрана, а не фиксированное число пикселей: на широком мониторе 80px превращаются в марку на конверте.',
    );
  }
  return 'Картинка занимает долю блока';
});

check.browser('focal-dominates', 'Картинка ловит взгляд первой', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var media = t.rect('.pitch__media');
  t.assert(media.width > 0, 'Картинка не загрузилась — файл cup.svg лежит рядом с index.html.');

  var share = t.layout.areaShare('.pitch__media', '.pitch');
  t.assert(
    share >= 0.25,
    'Картинка занимает ' +
      Math.round(share * 100) +
      '% блока — глазу не за что зацепиться, и он сразу утыкается в текст. У точки притяжения должно быть не меньше четверти площади: она должна выигрывать заметно, а не на пять процентов.',
  );
  return 'Картинка занимает ' + Math.round(share * 100) + '% блока';
});

check.browser('top-string', 'Верх картинки и первая строка заголовка на одной линии', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var media = t.rect('.pitch__media');
  var lines = t.layout.lines('.pitch__title');
  t.assert(lines.length > 0, 'Не нашёл текст заголовка.');

  var gap = Math.abs(lines[0].top - media.top);
  t.assert(
    gap <= 6,
    'Верх картинки и первая строка заголовка разошлись на ' +
      Math.round(gap) +
      'px. Это ещё одна струна: когда точка притяжения и заголовок начинаются на одной высоте, они читаются как одна композиция, а не как две вещи рядом.',
  );
  return 'Верхняя струна натянута';
});
