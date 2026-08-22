/*
  Иерархия — единственная тема главы, которую целиком видно по вычисленным
  стилям: кегль и межстрочный интервал считаются в любой среде.
  Поэтому здесь нет ни одной браузерной проверки.
*/
function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css — он подключён из index.html, эту строку не трогай.');
  return node.textContent || '';
}

function sizeOf(t, selector) {
  return parseFloat(t.style(selector, 'font-size')) || 0;
}

check('scale-contrast', 'Заголовок заметно крупнее текста', function (t) {
  t.assert(t.$('.intake__title'), 'Не нашёл заголовок — не меняй классы в разметке.');

  var scale = t.layout.fontScale('.intake__title', '.intake__note');
  t.assert(scale > 0, 'Не удалось прочитать размеры шрифта.');
  t.assert(
    scale >= 2.5,
    'Заголовок крупнее текста всего в ' +
      scale.toFixed(1) +
      ' раза (' +
      Math.round(sizeOf(t, '.intake__title')) +
      'px против ' +
      Math.round(sizeOf(t, '.intake__note')) +
      'px). Такую разницу глаз не считает за иерархию — он видит просто текст немного разного размера. Рабочий контраст начинается примерно с 2.5.',
  );
  return 'Заголовок крупнее текста в ' + scale.toFixed(1) + ' раза';
});

check('three-levels', 'Уровней ровно три', function (t) {
  var sizes = ['.intake__title', '.intake__lead', '.intake__note'].map(function (selector) {
    return Math.round(sizeOf(t, selector));
  });

  var unique = [];
  sizes.forEach(function (size) {
    if (unique.indexOf(size) === -1) unique.push(size);
  });

  t.assert(
    unique.length === 3,
    'Разных размеров получилось ' +
      unique.length +
      ' (' +
      sizes.join('px, ') +
      'px). Уровня должно быть ровно три: заголовок, подводка и текст. Два — и подводка сливается с текстом, четыре и больше — и человек перестаёт понимать, что главнее.',
  );
  return 'Три уровня: ' + sizes.join('px, ') + 'px';
});

check('tight-heading', 'У крупного кегля интервал плотнее', function (t) {
  var heading = t.layout.lineHeight('.intake__title');
  var text = t.layout.lineHeight('.intake__note');

  t.assert(heading !== null && text !== null, 'Не удалось прочитать межстрочный интервал.');
  t.assert(
    heading <= 1.25,
    'Межстрочный интервал заголовка — ' +
      heading.toFixed(2) +
      '. Для крупного кегля это слишком просторно: строки расходятся, и заголовок распадается на отдельные куски вместо одной фразы. Нужно около 1.1.',
  );
  t.assert(
    text >= 1.4,
    'Межстрочный интервал текста — ' +
      text.toFixed(2) +
      '. Мелкий текст с плотными строками читать тяжело: глаз цепляется за соседнюю строку. Нужно от 1.4.',
  );
  return 'Заголовок ' + heading.toFixed(2) + ', текст ' + text.toFixed(2);
});

check('scale-declared', 'Шкала объявлена один раз в :root', function (t) {
  var css = source(t);
  var root = css.match(/:root\s*\{([\s\S]*?)\}/);
  t.assert(root, 'Блока :root нет. Шкала размеров — то, что меняют целиком, поэтому её объявляют в одном месте.');

  var names = root[1].match(/--[a-z0-9-]+\s*:/gi) || [];
  t.assert(
    names.length >= 3,
    'Переменных в :root: ' + names.length + '. Трёх уровней текста — три размера, и все они должны лежать наверху файла.',
  );

  var uses = (css.replace(/:root\s*\{[\s\S]*?\}/g, '').match(/font-size\s*:\s*var\(/g) || []).length;
  t.assert(
    uses >= 3,
    'Через var() задано размеров: ' +
      uses +
      '. Объявить шкалу мало — ей надо пользоваться, иначе поменять всю типографику разом всё равно не выйдет.',
  );
  return 'Шкала из ' + names.length + ' величин, подставлена ' + uses + ' раза';
});
