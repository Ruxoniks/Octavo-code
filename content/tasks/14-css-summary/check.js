/*
  Итог главы про CSS. Часть проверок читает текст файла: правило «цвет только
  через переменную» и наличие :hover по картинке не увидеть.
*/
function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css. Он подключён из index.html — эту строку не трогай.');
  return node.textContent || '';
}

function rootBlock(t) {
  var match = source(t).match(/:root\s*\{([\s\S]*?)\}/);
  return match ? match[1] : '';
}

function withoutRoot(t) {
  return source(t)
    .replace(/:root\s*\{[\s\S]*?\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

check('variables', 'Всё настраиваемое собрано в :root', function (t) {
  var names = rootBlock(t).match(/--[a-z0-9-]+\s*:/gi) || [];
  t.assert(names.length > 0, 'Блока :root с переменными нет. Это было в задании «Переменные и тема».');
  t.assert(
    names.length >= 3,
    'Переменных в :root: ' + names.length + '. Нужно хотя бы три: цвет фона, цвет текста и акцент.',
  );

  var used = (withoutRoot(t).match(/var\(/g) || []).length;
  t.assert(
    used >= 3,
    'Переменные объявлены, но подставлены всего ' +
      used +
      ' раз. Объявить мало — надо ими пользоваться, иначе смысла в них нет.',
  );

  return 'Переменных: ' + names.length + ', подстановок: ' + used;
});

check('colors-from-variables', 'Ни одного цвета мимо переменной', function (t) {
  var literal = withoutRoot(t).match(/#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/gi) || [];
  t.assert(
    literal.length === 0,
    'Цвет записан прямо в правиле: ' +
      literal[0] +
      '. Все цвета живут в :root, ниже по файлу — только var(). Тогда сменить оформление можно из одного места.',
  );
  return 'Цвета берутся из переменных';
});

check('selectors', 'В ход пошли разные селекторы', function (t) {
  var rest = withoutRoot(t);
  var byClass = /(^|[\s,>+~{}])\.[a-z][a-z0-9_-]*/i.test(rest);
  var byTag = /(^|[\s,{}])(body|h1|h2|h3|p|ul|li|a|img|section|header|footer|main)\s*[,{]/i.test(rest);

  t.assert(byClass, 'Селекторов по классу в файле нет. Класс — способ сказать «оформи именно этот блок»: задание «Селекторы и цвета».');
  t.assert(
    byTag,
    'Селекторов по тегу нет. Общее — шрифт, цвет текста, отступы у абзацев — задают по тегу, чтобы не вешать класс на каждый элемент.',
  );

  return 'Есть и по тегу, и по классу';
});

check('spacing', 'Отступы расставлены осознанно', function (t) {
  var rest = withoutRoot(t);
  var padding = (rest.match(/(^|[;{])\s*padding[a-z-]*\s*:/gi) || []).length;
  var margin = (rest.match(/(^|[;{])\s*margin[a-z-]*\s*:/gi) || []).length;

  t.assert(
    padding > 0,
    'В файле нет ни одного padding. Внутренний отступ — то, что отделяет текст от края блока: задание «Коробочная модель».',
  );
  t.assert(
    margin > 0,
    'В файле нет ни одного margin. Внешний отступ разводит блоки между собой — без него страница слипается в одно пятно.',
  );

  return 'padding: ' + padding + ', margin: ' + margin;
});

check('hover', 'Страница отзывается на курсор', function (t) {
  t.assert(
    /:hover\s*[,{]/.test(source(t)),
    'Ни одного правила с :hover. Ссылка, которая никак не отзывается на наведение, выглядит неживой — человеку непонятно, можно ли по ней нажать.',
  );
  return 'Есть состояние :hover';
});

check('readable-width', 'Ширина текста ограничена', function (t) {
  t.assert(
    /max-width\s*:/i.test(withoutRoot(t)),
    'Ни у одного блока не задан max-width. На широком мониторе строка растянется на весь экран, и читать её станет невозможно — глаз теряет начало следующей строки.',
  );
  return 'Строка не растянется на весь монитор';
});

check.browser('flex-row', 'Хотя бы один ряд собран на flex', function (t) {
  var candidates = t.$$('.profile, .tags, .card, header, ul');
  var found = null;

  for (var i = 0; i < candidates.length; i++) {
    if (t.style(candidates[i], 'display') === 'flex') found = candidates[i];
  }

  if (!found && !t.style('body', 'display')) return t.skip('Стили не вычисляются в этой среде');

  t.assert(
    found,
    'Ни один блок не выстроен в ряд. Фотография рядом с именем или список умений в строку — это flex: задание «Блоки в ряд».',
  );
  return 'Ряд собран на .' + (found.className.split(' ')[0] || found.tagName.toLowerCase());
});
