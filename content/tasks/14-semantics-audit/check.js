check('single-main', 'Основное содержимое одно', function (t) {
  var mains = t.count('main');
  t.assert(
    mains > 0,
    'Тега <main> на странице не осталось. Основное содержимое нужно назвать — к нему прыгает тот, кто слушает страницу.',
  );
  t.assert(
    mains === 1,
    'Тегов <main> на странице: ' +
      mains +
      '. Прыжок «к основному содержимому» приведёт человека только в первую половину полосы: расписание останется в стороне. Расписание — это раздел внутри единственного <main>.',
  );
  t.assert(
    t.$('main #raspisanie') || t.$('main table'),
    'Расписание оказалось за пределами <main>. Оно такая же часть полосы, как и новости, — заверни его в <section> внутри основного содержимого.',
  );
  return 'Основное содержимое одно, расписание внутри него';
});

check('real-nav', 'Меню названо навигацией', function (t) {
  t.assert(
    t.count('div.nav') === 0,
    'Меню всё ещё собрано из <div class="nav">. Для машин это обычная коробка: такое меню нельзя ни объявить навигацией, ни пропустить целиком, а пропускать его приходится на каждой странице сайта.',
  );

  var nav = t.$('header nav');
  t.assert(nav, 'Тега <nav> в шапке нет. Класс придумал автор, имя тега знают все.');
  t.assert(
    nav.querySelectorAll('a').length >= 3,
    'Ссылок внутри <nav>: ' + nav.querySelectorAll('a').length + '. В меню их три.',
  );
  return 'Меню: ссылок ' + nav.querySelectorAll('a').length;
});

check('notes-are-articles', 'Заметки снова самостоятельны', function (t) {
  t.assert(
    t.count('section.note') === 0,
    'Заметок с тегом <section> осталось: ' +
      t.count('section.note') +
      '. Заметку можно вырезать и показать в чужой ленте — она останется понятной. Это <article>, а раздел без страницы смысл теряет.',
  );
  t.assert(
    t.count('main article') >= 2,
    'Заметок в <article>: ' + t.count('main article') + ', а на полосе их две.',
  );
  return 'Самостоятельных заметок: ' + t.count('main article');
});

check('no-header-in-footer', 'В подвале нет шапки', function (t) {
  t.assert(
    t.count('footer header') === 0,
    'В подвале всё ещё стоит <header>. Подвал — заключительная часть, начинать в ней нечего: программа чтения объявит человеку бессмыслицу. Обёртку убери, текст оставь.',
  );
  t.assert(
    t.text('body > footer').length > 20,
    'Вместе с обёрткой из подвала пропал текст. Убирать нужно только сам тег <header>, выходные данные газеты остаются.',
  );
  return 'Подвал в порядке';
});

check('table-headers', 'В расписании появились заголовки', function (t) {
  var table = t.$('table');
  t.assert(table, 'Таблица расписания пропала со страницы.');

  var caption = t.$('table caption');
  t.assert(
    caption && t.text(caption).length > 8,
    'У таблицы нет <caption>. Подпись объясняет, что это за таблица, и её слышат первой — до всяких цифр.',
  );

  var cols = t.$$('table th[scope="col"]');
  t.assert(
    cols.length >= 3,
    'Заголовков столбцов со scope="col": ' +
      cols.length +
      '. Пока все ячейки — <td>, значение 05:42 не связано ни со станцией, ни со столбцом: это просто число в сетке.',
  );

  var rows = t.$$('table tbody tr');
  t.assert(rows.length >= 2, 'Строк с данными в <tbody>: ' + rows.length + '. Станций в расписании две.');

  var wrongFirst = [];
  for (var i = 0; i < rows.length; i++) {
    var first = rows[i].children[0];
    if (!first) continue;
    if (first.tagName.toLowerCase() !== 'th' || t.attr(first, 'scope') !== 'row') {
      wrongFirst.push(t.text(first));
    }
  }
  t.assert(
    wrongFirst.length === 0,
    'Ячейка «' +
      wrongFirst[0] +
      '» — название станции, то есть заголовок своей строки: <th scope="row">. Иначе время есть, а откуда поезд — нет.',
  );
  return 'Таблица: столбцов ' + cols.length + ', строк ' + rows.length;
});

check('machine-dates', 'Даты понятны машине', function (t) {
  var times = t.$$('time');
  t.assert(times.length >= 2, 'Тегов <time> на странице: ' + times.length + ', а заметок две.');

  var without = [];
  var wrong = [];
  for (var i = 0; i < times.length; i++) {
    var value = t.attr(times[i], 'datetime');
    if (!value) {
      without.push(t.text(times[i]));
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      wrong.push(value);
    }
  }

  t.assert(
    without.length === 0,
    'У даты «' +
      without[0] +
      '» нет атрибута datetime. Какого года это «18 августа» и в каком формате — машина не знает, сортировать и показывать «свежее» не сможет.',
  );
  t.assert(
    wrong.length === 0,
    'Дата записана как «' + wrong[0] + '». Машинный формат один на весь мир: год-месяц-день, например 2026-08-18.',
  );
  return 'Машинных дат: ' + times.length;
});
