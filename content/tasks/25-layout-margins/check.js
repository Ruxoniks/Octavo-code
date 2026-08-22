/*
  Поля видно и без раскладки: и padding блока, и margin внутри него —
  обычные вычисленные величины. Настоящую длину строки меряем в браузере.
*/
function outerPadding(t) {
  return Math.min(
    parseFloat(t.style('.quote', 'padding-left')) || 0,
    parseFloat(t.style('.quote', 'padding-right')) || 0,
    parseFloat(t.style('.quote', 'padding-top')) || 0,
  );
}

function innerGap(t) {
  return parseFloat(t.style('.quote__text', 'margin-bottom')) || 0;
}

check('outer-air', 'Снаружи воздуха больше, чем внутри', function (t) {
  var outer = outerPadding(t);
  var inner = innerGap(t);
  t.assert(t.$('.quote'), 'Не нашёл блок .quote — не меняй классы в разметке.');

  t.assert(
    outer > 0,
    'Текст прижат к краям блока: поля равны нулю. Пустота вокруг — это не потерянное место, а то, что отделяет содержимое от всего остального.',
  );
  t.assert(
    outer >= inner * 1.5,
    'Внутри блока воздуха больше, чем по краям: отзыв и подпись разведены на ' +
      Math.round(inner) +
      'px, а от края их отделяет ' +
      Math.round(outer) +
      'px. При таком раскладе блок распадается на два отдельных сообщения. Снаружи должно быть просторнее, чем внутри, — тогда содержимое читается как одно целое.',
  );
  return 'Поля ' + Math.round(outer) + 'px против ' + Math.round(inner) + 'px внутри';
});

check('line-width', 'Длина строки ограничена', function (t) {
  var width = parseFloat(t.style('.quote', 'max-width'));
  t.assert(
    width > 0,
    'Ширина блока ничем не ограничена, и на широком экране строка растянется во всю его длину. Глаз дочитает её до конца и не найдёт начало следующей.',
  );
  t.assert(
    width <= 700,
    'Блок шириной ' + Math.round(width) + 'px — для сплошного текста это всё ещё слишком длинная строка.',
  );
  return 'Ширина блока ' + Math.round(width) + 'px';
});

check.browser('comfortable-line', 'В строке комфортное число знаков', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var lines = t.layout.lines('.quote__text');
  t.assert(lines.length >= 2, 'Отзыв уместился в одну строку — не на чем проверять ритм чтения.');

  var widest = 0;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].width > widest) widest = lines[i].width;
  }

  // Средняя ширина знака — примерно половина кегля.
  var size = parseFloat(t.style('.quote__text', 'font-size')) || 16;
  var chars = Math.round(widest / (size * 0.5));

  t.assert(
    chars >= 35 && chars <= 80,
    'В самой длинной строке около ' +
      chars +
      ' знаков. Комфортно читается 45–75: короче — текст рвётся на клочки, длиннее — глаз теряет начало следующей строки.',
  );
  return 'В строке около ' + chars + ' знаков';
});
