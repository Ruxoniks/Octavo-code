check('header-h1', 'Заголовок лежит внутри <header>', function (t) {
  var header = t.$('header');
  t.assert(header, 'Тега <header> нет — оберни в него заголовок.');
  t.assert(header.querySelector('h1'), 'Внутри <header> нет <h1>. Заголовок должен быть вложен в шапку.');
  return 'Шапка на месте';
});

check('main-exists', 'Есть ровно один <main>', function (t) {
  var count = t.count('main');
  t.assert(count > 0, 'Тега <main> нет. Основное содержимое страницы кладут в <main>.');
  t.assert(count === 1, 'Нашёл <main> ' + count + ' штуки. На странице он должен быть один.');
  return 'Основной блок на месте';
});

check('list-in-main', 'Список из трёх пунктов внутри <main>', function (t) {
  var main = t.$('main');
  t.assert(main, 'Сначала добавь <main>.');
  var list = main.querySelector('ul');
  t.assert(list, 'Внутри <main> нет списка <ul>.');
  var items = list.querySelectorAll('li');
  t.assert(items.length >= 3, 'В списке пунктов: ' + items.length + '. Нужно минимум три <li>.');
  return 'Пунктов в списке: ' + items.length;
});

check('paragraph-in-main', 'Внутри <main> есть абзац', function (t) {
  var main = t.$('main');
  t.assert(main, 'Сначала добавь <main>.');
  t.assert(main.querySelector('p'), 'Добавь в <main> хотя бы один абзац <p>.');
  return 'Абзац на месте';
});

check('footer', 'Внизу есть <footer> с текстом', function (t) {
  var footer = t.$('footer');
  t.assert(footer, 'Тега <footer> нет.');
  t.assert(t.text(footer).length >= 3, 'Подвал пустой — напиши в нём что-нибудь.');
  return 'Подвал: «' + t.text(footer) + '»';
});
