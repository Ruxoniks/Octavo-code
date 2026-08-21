check('example', 'Что проверяем — понятной фразой', function (t) {
  var element = t.$('h1');
  t.assert(element, 'Тега <h1> нет. Добавь строку вида <h1>Привет!</h1> внутрь <body>.');
  return 'Заголовок: «' + t.text(element) + '»';
});

// Проверке нужна геометрия или вычисленные стили — значит, нужен настоящий браузер.
check.browser('example-layout', 'Блок стоит там, где задумано', function (t) {
  var rect = t.rect(t.$('h1'));
  t.assert(rect.width > 0, 'Заголовок ничего не занимает на экране.');
  return 'Ширина заголовка: ' + Math.round(rect.width) + 'px';
});
