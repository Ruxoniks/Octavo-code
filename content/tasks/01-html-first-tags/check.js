check('has-h1', 'На странице есть заголовок <h1>', function (t) {
  var h1 = t.$('h1');
  t.assert(h1, 'Тега <h1> нет. Добавь строку вида <h1>Привет!</h1> внутрь <body>.');
  t.assert(t.text(h1).length >= 3, 'Заголовок пустой — напиши в нём хотя бы пару слов.');
  return 'Заголовок: «' + t.text(h1) + '»';
});

check('two-paragraphs', 'Есть два абзаца <p>', function (t) {
  var paragraphs = t.$$('p').filter(function (p) {
    return t.text(p).length > 0;
  });
  t.assert(
    paragraphs.length >= 2,
    'Нашёл абзацев с текстом: ' + paragraphs.length + '. Нужно два — каждый в своей паре <p>…</p>.'
  );
  return 'Абзацев: ' + paragraphs.length;
});

check('order', 'Заголовок стоит выше абзацев', function (t) {
  var h1 = t.$('h1');
  var p = t.$('p');
  t.assert(h1 && p, 'Сначала добавь и заголовок, и абзац.');
  var position = h1.compareDocumentPosition(p);
  t.assert(
    (position & 4) !== 0,
    'Абзац оказался выше заголовка. Порядок тегов в файле — это и есть порядок на странице.'
  );
  return 'Порядок правильный';
});
