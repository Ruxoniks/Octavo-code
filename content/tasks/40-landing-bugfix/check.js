check('cards-not-nested', 'Карточки лежат рядом, а не внутри друг друга', function (t) {
  var wrapper = t.$('.cards');
  t.assert(wrapper, 'Контейнер .cards пропал со страницы.');

  // Прямых детей считаем перебором: селектор :scope поддержан не везде.
  var direct = Array.prototype.filter.call(wrapper.children, function (node) {
    return node.className && String(node.className).indexOf('card') !== -1;
  }).length;
  var total = t.count('.card');
  t.assert(
    total === 3,
    'Карточек на странице: ' + total + ', а должно быть три.'
  );
  t.assert(
    direct === 3,
    'Прямых детей у .cards только ' + direct + ' из ' + total +
      ': одна карточка оказалась внутри другой. Такое бывает, когда потерян закрывающий </article>.'
  );
  return 'Три карточки на одном уровне';
});

check('section-class', 'Секция преимуществ найдена по классу', function (t) {
  t.assert(
    t.count('.features') > 0,
    'Нет элемента с классом features. Проверь написание класса у секции — CSS ищет его буква в букву.'
  );
  return 'Класс features на месте';
});

check('image-alt', 'У картинки есть описание', function (t) {
  var image = t.$('img');
  t.assert(image, 'Картинка пропала со страницы.');
  var alt = t.normalize(t.attr(image, 'alt') || '');
  t.assert(alt.length > 0, 'У <img> нет атрибута alt. Без него картинку не «увидят» ни программы чтения с экрана, ни поисковики.');
  t.assert(alt.split(' ').length >= 2, 'alt слишком короткий: «' + alt + '». Опиши, что на картинке.');
  return 'Картинка описана: «' + alt + '»';
});

check('cta-link', 'Кнопка ведёт на настоящий адрес', function (t) {
  var cta = t.$('.cta');
  t.assert(cta, 'Кнопка .cta пропала из шапки.');
  var href = t.attr(cta, 'href') || '';
  t.assert(href !== '#' && href !== '', 'href у кнопки — «' + href + '». Такая ссылка никуда не ведёт.');
  t.assert(
    /^(https:\/\/|tel:|mailto:)/.test(href),
    'Адрес «' + href + '» не похож на настоящий: нужен https://, tel: или mailto:'
  );
  return 'Кнопка ведёт на ' + href;
});

check('cards-flex', 'Карточки выстроены в ряд', function (t) {
  t.assert(t.count('.card') === 3, 'Ожидал три карточки .card');
  return t.expectStyle(
    '.cards',
    'display',
    'flex',
    'У .cards нет display: flex, поэтому flex: 1 у карточек ни на что не влияет и они идут друг под другом'
  );
});

check.browser('cards-same-line', 'Карточки действительно на одной линии', function (t) {
  var tops = t.$$('.card').map(function (card) {
    return Math.round(t.rect(card).top);
  });
  t.assert(
    Math.max.apply(null, tops) - Math.min.apply(null, tops) <= 2,
    'Карточки на разной высоте: ' + tops.join(', ') + '. Значит, ряд не получился.'
  );
  return 'Ряд из трёх карточек';
});
