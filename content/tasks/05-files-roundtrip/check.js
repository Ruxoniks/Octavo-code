check('about-section', 'Появился блок «Обо мне»', function (t) {
  var about = t.$('section.about');
  t.assert(about, 'Не нашёл <section class="about">. Проверь, что применил изменения после перетаскивания файла.');
  return 'Блок на месте';
});

check('about-heading', 'У блока есть заголовок <h2>', function (t) {
  var about = t.$('section.about');
  t.assert(about, 'Сначала добавь <section class="about">.');
  var heading = about.querySelector('h2');
  t.assert(heading, 'Внутри блока нет <h2>. Заголовок второго уровня подписывает раздел.');
  t.assert(t.text(heading).length >= 3, 'Заголовок раздела пустой.');
  return 'Заголовок: «' + t.text(heading) + '»';
});

check('about-text', 'В блоке есть свой текст', function (t) {
  var about = t.$('section.about');
  t.assert(about, 'Сначала добавь <section class="about">.');
  var paragraph = about.querySelector('p');
  t.assert(paragraph, 'Внутри блока нет абзаца <p>.');
  var text = t.text(paragraph);
  t.assert(text.length >= 25, 'Текста маловато (' + text.length + ' символов). Напиши пару предложений от себя.');
  t.assert(
    text.indexOf('Здесь пара предложений') === -1,
    'Это текст из примера — замени его своим.'
  );
  return 'Текста: ' + text.length + ' символов';
});
