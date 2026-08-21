check('section-exists', 'Появилась секция «Как мы работаем»', function (t) {
  var section = t.$('section.steps');
  t.assert(section, 'Не нашёл <section class="steps">. Класс важен: по нему секцию находят и стили, и проверка.');
  var heading = section.querySelector('h2');
  t.assert(heading, 'Внутри секции нет <h2> — раздел без заголовка читается как продолжение предыдущего.');
  return 'Секция и заголовок на месте';
});

check('reuses-cards', 'Секция собрана из тех же блоков, что и соседние', function (t) {
  var section = t.$('section.steps');
  t.assert(section, 'Сначала добавь секцию .steps');
  var wrapper = section.querySelector('.cards');
  t.assert(wrapper, 'Внутри нет контейнера .cards — именно он раскладывает карточки в ряд, и он уже описан в CSS.');
  var cards = wrapper.querySelectorAll('.card');
  t.assert(cards.length === 3, 'Карточек .card: ' + cards.length + ', а нужно ровно три шага.');

  var full = Array.prototype.filter.call(cards, function (card) {
    return card.querySelector('h3') && card.querySelector('p');
  });
  t.assert(full.length === 3, 'У каждой карточки должны быть <h3> и <p>, как у соседних блоков. Полных: ' + full.length + '.');
  return 'Три карточки в общем стиле';
});

check('numbered-steps', 'Шаги пронумерованы по порядку', function (t) {
  var titles = t.$$('section.steps .card h3').map(function (node) {
    return t.text(node);
  });
  t.assert(titles.length === 3, 'Сначала добавь три карточки с заголовками.');

  for (var i = 0; i < 3; i++) {
    var expected = String(i + 1);
    t.assert(
      titles[i].indexOf(expected) !== -1,
      'Шаг №' + (i + 1) + ' называется «' + titles[i] + '» — в нём нет номера ' + expected +
        '. Порядок шагов должен читаться с первого взгляда.'
    );
  }
  return 'Шаги 1, 2, 3 идут по порядку';
});

check('placed-before-footer', 'Секция стоит между преимуществами и подвалом', function (t) {
  var steps = t.$('section.steps');
  var features = t.$('.features');
  var footer = t.$('.footer');
  t.assert(steps && features && footer, 'Нужны секция .steps, секция .features и подвал .footer');

  t.assert(
    (features.compareDocumentPosition(steps) & 4) !== 0,
    'Секция «Как мы работаем» оказалась выше преимуществ. Сначала объясняем, чем хороши, потом — как всё устроено.'
  );
  t.assert(
    (steps.compareDocumentPosition(footer) & 4) !== 0,
    'Секция оказалась ниже подвала. Подвал всегда последний.'
  );
  return 'Порядок блоков верный';
});

check.browser('steps-in-row', 'Карточки шагов стоят в ряд', function (t) {
  var tops = t.$$('section.steps .card').map(function (card) {
    return Math.round(t.rect(card).top);
  });
  t.assert(tops.length === 3, 'Нужны три карточки.');
  t.assert(
    Math.max.apply(null, tops) - Math.min.apply(null, tops) <= 2,
    'Карточки на разной высоте: ' + tops.join(', ') + '. Проверь, что обернул их в .cards.'
  );
  return 'Ряд из трёх шагов';
});
