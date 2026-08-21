check('h1-kept', 'Старый заголовок на месте', function (t) {
  var h1 = t.$('h1');
  t.assert(h1, 'Заголовок <h1> пропал. Значит, код заменил больше, чем нужно было.');
  t.assert(
    t.text(h1).indexOf('Ленивый курсор') !== -1,
    'Текст заголовка изменился на «' + t.text(h1) + '». Существующий контент трогать было нельзя.'
  );
  return 'Заголовок не пострадал';
});

check('benefits-section', 'Появилась секция .benefits', function (t) {
  var section = t.$('section.benefits');
  t.assert(section, 'Не нашёл <section class="benefits">. Проверь имя класса и тег.');
  return 'Секция на месте';
});

check('three-cards', 'Внутри ровно три карточки .benefit', function (t) {
  var section = t.$('section.benefits');
  t.assert(section, 'Сначала добавь секцию .benefits');
  var cards = section.querySelectorAll('.benefit');
  t.assert(cards.length === 3, 'Карточек с классом benefit: ' + cards.length + ', а нужно ровно три.');
  var full = Array.prototype.filter.call(cards, function (card) {
    return card.querySelector('h3') && card.querySelector('p');
  });
  t.assert(full.length === 3, 'У каждой карточки должны быть <h3> и <p>, а полных карточек: ' + full.length + '.');
  return 'Три карточки с заголовком и текстом';
});

check('no-external', 'Нет внешних библиотек и картинок', function (t) {
  var external = t.$$('script[src], link[href], img[src]').filter(function (node) {
    var url = node.getAttribute('src') || node.getAttribute('href') || '';
    return url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('//') === 0;
  });
  t.assert(
    external.length === 0,
    'В разметке появились внешние ресурсы (' + external.length + ' шт.). По условию задачи их быть не должно.'
  );
  return 'Только свой код';
});

check('flex-row', 'Карточки выстроены в ряд через flex', function (t) {
  return t.expectStyle(
    'section.benefits',
    'display',
    'flex',
    'У .benefits нет display: flex — карточки идут друг под другом'
  );
});

check.browser('same-line', 'Карточки действительно на одной линии', function (t) {
  var cards = t.$$('.benefit');
  t.assert(cards.length === 3, 'Нужны три карточки.');
  var tops = cards.map(function (card) {
    return Math.round(t.rect(card).top);
  });
  t.assert(
    Math.max.apply(null, tops) - Math.min.apply(null, tops) <= 2,
    'Карточки на разной высоте: ' + tops.join(', ') + '. Значит, ряд не получился.'
  );
  return 'Ряд из трёх карточек';
});
