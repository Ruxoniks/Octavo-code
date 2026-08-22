/*
  Единственное задание главы, где центрирование — правильный ответ.
  Всё, что для этого нужно, читается по вычисленным стилям.
*/
check('centered', 'Финальный экран собран по центру', function (t) {
  var align = t.style('.cta', 'text-align');
  t.assert(align, 'Не нашёл .cta — не меняй классы в разметке.');
  t.assert(
    align === 'center',
    'Текст прижат влево (text-align: ' +
      align +
      '). На финальном экране читать нечего, ритма чтения здесь нет — и центр перестаёт быть ошибкой. Ровно тот приём, который ломал первый экран, тут работает.',
  );

  // Браузер раскладывает margin: 0 auto в конкретные пиксели, а тестовая
  // среда оставляет слово auto — принимаем обе формы записи одного и того же.
  var left = t.style('.cta__inner', 'margin-left');
  var right = t.style('.cta__inner', 'margin-right');
  var even = parseFloat(left) > 0 && Math.abs(parseFloat(left) - parseFloat(right)) <= 2;

  t.assert(
    left === 'auto' || even,
    'Содержимое не отцентрировано по горизонтали (margin-left: ' +
      left +
      '). Блок с заданной шириной ставят по центру через margin: 0 auto — браузер делит свободное место поровну между полями.',
  );
  return 'Центр на месте';
});

check('narrow', 'Строка короткая', function (t) {
  var width = parseFloat(t.style('.cta__inner', 'max-width'));
  t.assert(
    width > 0,
    'Ширина содержимого не ограничена. Центрировать имеет смысл только короткие строки: у длинного центрированного текста каждая строка снова начинается в новом месте.',
  );
  t.assert(
    width <= 480,
    'Содержимое шириной ' +
      Math.round(width) +
      'px — для центрированного текста это уже много. Здесь всего одно обещание и одна кнопка, им хватит куда меньшего.',
  );
  return 'Ширина содержимого ' + Math.round(width) + 'px';
});

check('air', 'Вокруг действия много воздуха', function (t) {
  var outer = parseFloat(t.style('.cta', 'padding-top')) || 0;
  var inner = parseFloat(t.style('.cta__note', 'margin-bottom')) || 0;

  t.assert(
    outer >= 64,
    'Поле сверху ' +
      Math.round(outer) +
      'px. Финальный экран держится на пустоте: единственное действие посреди свободного места видно лучше любой яркой кнопки.',
  );
  t.assert(
    outer >= inner * 2,
    'Внутри блока воздуха почти столько же, сколько снаружи (' +
      Math.round(inner) +
      'px против ' +
      Math.round(outer) +
      'px). Здесь разрыв должен быть особенно заметным — это последний экран, и на нём не должно быть ничего, кроме одного действия.',
  );
  return 'Поля ' + Math.round(outer) + 'px против ' + Math.round(inner) + 'px внутри';
});

check('single-action', 'Действие в блоке одно', function (t) {
  var actions = t.count('.cta a, .cta button');
  t.assert(actions > 0, 'На финальном экране нет ни одной кнопки.');
  t.assert(
    actions === 1,
    'Действий в блоке: ' +
      actions +
      '. Финальный экран закрывает страницу одним решением. Второй вариант выбора здесь не помогает, а отнимает: человеку снова есть что обдумывать.',
  );
  return 'Одно действие';
});

check.browser('action-centered', 'Кнопка стоит по центру блока', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var action = t.rect('.cta__action');
  var block = t.rect('.cta');
  t.assert(action.width > 0, 'Не нашёл кнопку.');

  var actionCentre = action.left + action.width / 2;
  var blockCentre = block.left + block.width / 2;
  var offset = Math.abs(actionCentre - blockCentre);

  t.assert(
    offset <= 3,
    'Центр кнопки смещён относительно центра блока на ' + Math.round(offset) + 'px.',
  );
  return 'Кнопка ровно посередине';
});
