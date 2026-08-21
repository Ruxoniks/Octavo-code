/*
  Проверки этого задания читают сам текст CSS: правила вроде «ни одного
  !important» по вычисленным стилям не увидеть, их видно только в исходнике.
  Файл лежит в DOM — движок подставляет его в <style data-file="style.css">.
*/
function source(t) {
  var node = t.$('style[data-file="style.css"]');
  t.assert(node, 'Не нашёл style.css. Он должен быть подключён из index.html — не трогай эту строку.');
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

check('variables-declared', 'Цвета и отступы объявлены в :root', function (t) {
  var names = rootBlock(t).match(/--[a-z0-9-]+\s*:/gi) || [];
  t.assert(
    names.length > 0,
    'Блока :root с переменными нет. Переменная объявляется так: :root { --accent: #a35a2a; }',
  );
  t.assert(
    names.length >= 4,
    'Переменных в :root: ' +
      names.length +
      '. Их нужно хотя бы четыре: цвета фона, текста и акцента плюс отступ.',
  );
  return 'Переменных в :root: ' + names.length;
});

check('colors-only-in-root', 'Ни одного цвета мимо переменной', function (t) {
  var rest = withoutRoot(t);
  var literal = rest.match(/#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/gi) || [];

  t.assert(
    literal.length === 0,
    'Нашёл цвет прямо в правиле: ' +
      literal[0] +
      '. Все цвета живут в :root, а ниже по файлу подставляются через var(). Иначе поменять оформление можно будет только поиском по файлу.',
  );
  return 'Все цвета берутся из переменных';
});

check('spacing-through-variables', 'Отступы заданы переменными', function (t) {
  var rest = withoutRoot(t);
  var declarations = rest.match(/(?:^|[;{])\s*(?:padding|margin)[a-z-]*\s*:[^;}]+/gi) || [];
  var offenders = [];

  for (var i = 0; i < declarations.length; i++) {
    var value = declarations[i].split(':')[1];
    if (value.indexOf('var(') !== -1) continue;
    // 0, auto и inherit переменной не требуют — там нечего настраивать.
    if (/^[\s]*(0|auto|inherit|initial|unset)([\s]+(0|auto))*[\s]*$/i.test(value)) continue;
    offenders.push(declarations[i].replace(/^[;{\s]+/, '').trim());
  }

  t.assert(
    offenders.length === 0,
    'Отступ записан числом: «' +
      offenders[0] +
      '». Отступы — это ритм страницы, и он должен настраиваться из одного места. Заведи --sp-… в :root и подставь var().',
  );
  t.assert(declarations.length > 0, 'В карточке нет ни одного отступа — текст лежит вплотную к краям.');
  return 'Отступов через переменные: ' + declarations.length;
});

check('flexible-width', 'Ширина карточки не в пикселях', function (t) {
  var rules = source(t).match(/\.card\s*\{[\s\S]*?\}/g) || [];
  t.assert(rules.length > 0, 'Правила для .card нет — карточка не оформлена.');

  var widths = rules.join('\n').match(/(?:^|[;{])\s*(?:max-)?width\s*:[^;}]+/gi) || [];
  t.assert(
    widths.length > 0,
    'У карточки не задана ширина, и она растянется на весь экран. Строка длиной в монитор не читается.',
  );

  for (var i = 0; i < widths.length; i++) {
    var value = widths[i].split(':')[1];
    t.assert(
      !/\d\s*px/i.test(value),
      'Ширина задана в пикселях: «' +
        widths[i].replace(/^[;{\s]+/, '').trim() +
        '». Пиксели не подстраиваются ни под размер шрифта, ни под узкий экран. Возьми rem, % или clamp().',
    );
  }

  return 'Ширина карточки гибкая';
});

check('no-important', 'Ни одного !important', function (t) {
  t.assert(
    source(t).indexOf('!important') === -1,
    '!important в файле есть. Это не решение конфликта селекторов, а способ спрятать его от себя: следующий конфликт придётся тушить вторым !important.',
  );
  return 'Файл обошёлся без !important';
});

check.browser('card-row', 'Фото и текст стоят в ряд', function (t) {
  return t.expectStyle(
    '.card',
    'display',
    'flex',
    'Фото и текст идут друг под другом. Чтобы поставить их в ряд, карточке нужен display: flex.',
  );
});

check.browser('foot-spread', 'Цена и кнопка разведены по краям', function (t) {
  var display = t.style('.card__foot', 'display');
  if (!display) return t.skip('Стили не вычисляются в этой среде');

  t.assert(display === 'flex', 'Строке с ценой и кнопкой нужен display: flex — тогда они окажутся на одной линии.');

  var justify = t.style('.card__foot', 'justify-content');
  t.assert(
    justify === 'space-between',
    'Цена и кнопка сейчас слиплись (justify-content: ' +
      justify +
      '). space-between раздвинет их по краям строки и оставит между ними всё свободное место.',
  );
  return 'Цена слева, кнопка справа';
});
