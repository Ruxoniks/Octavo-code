check('table-exists', 'Расписание стало таблицей', function (t) {
  var table = t.$('table');
  t.assert(
    table,
    'Тега <table> на странице нет. Сетку из дивов человек прочитает глазами, но связь «Каменка + первая = 05:42» видна только в настоящей таблице.',
  );
  t.assert(
    t.count('div.row') === 0,
    'Остались строки-дивы: ' + t.count('div.row') + '. Расписание нужно перенести в таблицу целиком, а не наполовину.',
  );
  return 'Таблица на месте';
});

check('caption', 'У таблицы есть подпись', function (t) {
  var caption = t.$('table caption');
  t.assert(
    caption,
    'У таблицы нет <caption>. Подпись объясняет, что это за таблица, — и тот, кто слушает страницу, услышит её первой, ещё до цифр.',
  );
  t.assert(
    t.text(caption).length > 8,
    'Подпись слишком короткая. Скажи в ней, что это за расписание и когда оно действует.',
  );
  return 'Подпись: «' + t.text(caption) + '»';
});

check('column-headers', 'Столбцы подписаны', function (t) {
  var head = t.$('table thead');
  t.assert(head, 'В таблице нет <thead>. Строка с названиями столбцов — шапка таблицы, её отделяют от данных.');

  var cols = t.$$('table thead th');
  t.assert(
    cols.length >= 4,
    'Заголовочных ячеек в шапке: ' + cols.length + '. Столбцов четыре: станция, первая, днём, последняя. И каждый — <th>, а не <td>.',
  );

  var without = [];
  for (var i = 0; i < cols.length; i++) {
    if (t.attr(cols[i], 'scope') !== 'col') without.push(t.text(cols[i]));
  }
  t.assert(
    without.length === 0,
    'У заголовка «' +
      without[0] +
      '» нет scope="col". Без него ячейка просто выделена жирным; scope говорит «я заголовок этого столбца» — и связывает с ним все числа под собой.',
  );
  return 'Столбцов подписано: ' + cols.length;
});

check('rows', 'Строки на месте и подписаны станциями', function (t) {
  var rows = t.$$('table tbody tr');
  t.assert(
    rows.length >= 4,
    'Строк в <tbody>: ' + rows.length + '. Станций в расписании четыре — Каменка, Заречье, Полевая и Соловьиный Брод.',
  );

  var columns = t.$$('table thead th').length;
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll('th, td').length;
    t.assert(
      cells === columns,
      'В строке ' + (i + 1) + ' ячеек: ' + cells + ', а столбцов в шапке: ' + columns + '. Расписание разъедется: значения перестанут попадать в свои столбцы.',
    );
  }

  var wrongFirst = [];
  for (var j = 0; j < rows.length; j++) {
    var first = rows[j].children[0];
    if (!first) continue;
    if (first.tagName.toLowerCase() !== 'th' || t.attr(first, 'scope') !== 'row') {
      wrongFirst.push(t.text(first));
    }
  }

  t.assert(
    wrongFirst.length === 0,
    'Ячейка «' +
      wrongFirst[0] +
      '» — это название станции, то есть заголовок своей строки: <th scope="row">. Иначе программа чтения назовёт время, но не скажет, откуда поезд.',
  );
  return 'Строк: ' + rows.length + ', у каждой свой заголовок';
});
