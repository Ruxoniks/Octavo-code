/*
  Итог главы «Собираем и кудесим»: страница собрана из блоков и умеет
  одно живое действие. Последняя проверка сама нажимает на кнопку.
*/
check('page-order', 'Блоки стоят в правильном порядке', function (t) {
  var body = t.$('body');
  var order = [];

  for (var i = 0; i < body.children.length; i++) {
    var tag = body.children[i].tagName.toLowerCase();
    if (tag === 'header' || tag === 'main' || tag === 'footer') order.push(tag);
  }

  t.assert(order.indexOf('header') !== -1, 'Шапки <header> нет.');
  t.assert(order.indexOf('main') !== -1, 'Основной части <main> нет.');
  t.assert(order.indexOf('footer') !== -1, 'Подвала <footer> нет.');
  t.assert(
    order.join(' ') === 'header main footer',
    'Порядок блоков получился такой: ' +
      order.join(' → ') +
      '. Человек читает страницу сверху вниз, и порядок в разметке — это порядок на экране: задание «Порядок блоков на странице».',
  );

  return 'header → main → footer';
});

check('components', 'Страница собрана из отдельных блоков', function (t) {
  var blocks = t.$$('main section, main article');
  t.assert(
    blocks.length >= 3,
    'Разделов внутри <main>: ' +
      blocks.length +
      '. Нужно хотя бы три: страница собирается из самостоятельных кусков, а не из одного полотна текста.',
  );

  var untitled = 0;
  for (var i = 0; i < blocks.length; i++) {
    if (!blocks[i].querySelector('h2, h3')) untitled += 1;
  }

  t.assert(
    untitled === 0,
    'У ' + untitled + ' раздела нет собственного заголовка. Блок без заголовка — это просто текст, который некуда положить.',
  );

  return 'Блоков на странице: ' + blocks.length;
});

check('title', 'Страница подписана', function (t) {
  var title = t.text('title');
  t.assert(title.length > 0 && title !== 'Документ', 'В <title> осталось «Документ». Назови страницу так, как назвал бы её заказчик.');
  t.assert(t.count('h1') === 1, 'Заголовков <h1> на странице: ' + t.count('h1') + '. Он должен быть ровно один.');
  return 'Страница: «' + title + '»';
});

check('script-connected', 'Скрипт подключён и не пустой', function (t) {
  var script = t.$('script[data-file="app.js"]');
  t.assert(
    script,
    'app.js не подключён. Строка <script src="app.js"></script> ставится перед закрывающим </body> — иначе скрипт запустится раньше, чем появится разметка, и ничего не найдёт.',
  );

  var code = (script.textContent || '').replace(/\/\/[^\n]*/g, '').trim();
  t.assert(code.length > 0, 'Файл app.js пуст. Одно живое действие на странице — часть задания.');
  t.assert(
    code.indexOf('addEventListener') !== -1 || code.indexOf('onclick') !== -1,
    'В app.js нет ни одного обработчика события. Страница оживает там, где код начинает слушать действия человека.',
  );

  return 'Скрипт на месте';
});

check('button-reacts', 'Кнопка действительно работает', function (t) {
  var button = t.$('main button');
  t.assert(button, 'На странице нет кнопки. Живое действие — это то, что человек может нажать.');

  var before = t.normalize(t.$('main').textContent || '');
  button.click();
  var after = t.normalize(t.$('main').textContent || '');

  t.assert(
    before !== after,
    'Нажал на кнопку — на странице ничего не изменилось. Обработчик либо не повешен, либо падает с ошибкой: загляни в консоль превью.',
  );

  return 'Кнопка меняет страницу';
});
