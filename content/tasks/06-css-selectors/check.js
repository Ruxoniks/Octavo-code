function isBlackish(t, value) {
  var rgb = t.parseColor(value);
  return !rgb || (rgb[0] < 40 && rgb[1] < 40 && rgb[2] < 40);
}

check('h1-color', 'Заголовок покрашен', function (t) {
  t.assert(t.$('h1'), 'В разметке нет <h1> — проверь, что файл index.html не изменился.');
  return t.expectStyle(
    'h1',
    'color',
    function (value) {
      return !isBlackish(t, value);
    },
    'Заголовок всё ещё чёрный. Задай ему color в style.css'
  );
});

check('tag-background', 'У класса .tag есть фон', function (t) {
  var tags = t.$$('.tag');
  t.assert(tags.length >= 2, 'Ожидал минимум два элемента с классом tag в разметке.');
  return t.expectStyle(
    '.tag',
    'background-color',
    function (value) {
      var rgb = t.parseColor(value);
      return value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)' && rgb !== null;
    },
    'У .tag нет фона. Добавь правило .tag { background-color: … }'
  );
});

check('hero-background', 'Блок #hero отличается от страницы', function (t) {
  t.assert(t.$('#hero'), 'В разметке нет элемента с id="hero".');
  var body = t.style('body', 'background-color');
  return t.expectStyle(
    '#hero',
    'background-color',
    function (value) {
      return value !== body && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent';
    },
    'Фон #hero совпадает с фоном страницы — блок незаметен'
  );
});
