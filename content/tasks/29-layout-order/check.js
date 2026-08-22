var EXPECTED = ['image', 'headline', 'solution', 'proof', 'action'];

var NAMES = {
  image: 'фотография',
  headline: 'заголовок',
  solution: 'как это устроено',
  proof: 'доказательства',
  action: 'кнопка',
};

/* Почему именно здесь, а не где-то ещё. */
var REASONS = {
  image: 'Образ считывается мгновенно и ловит взгляд раньше любого текста — поэтому он первый.',
  headline: 'Заголовок называет то, чего человек хочет, и удерживает его. До образа он работает вхолостую: читать ещё незачем.',
  solution: 'Заголовок вскрывает вопрос «а я смогу?». Ответ должен идти сразу за ним — вопрос без ответа человек не прощает.',
  proof: 'Аргументы нужны тому, кто уже заинтересовался. Раньше их просто некому читать.',
  action: 'Кнопка стоит в конце, когда человек готов. Призыв раньше аргументов торопит и пугает.',
};

function currentOrder(t) {
  return t.$$('[data-block]').map(function (node) {
    return node.getAttribute('data-block');
  });
}

check('all-blocks', 'На первом экране все пять шагов', function (t) {
  var order = currentOrder(t);
  t.assert(order.length > 0, 'Экран пустой — перетащи блоки в правую колонку.');

  var missing = EXPECTED.filter(function (id) {
    return order.indexOf(id) === -1;
  }).map(function (id) {
    return NAMES[id];
  });

  t.assert(missing.length === 0, 'Не хватает шагов: ' + missing.join(', ') + '.');
  return 'Все пять шагов на месте';
});

check('order', 'Шаги идут в порядке чтения', function (t) {
  var order = currentOrder(t);

  for (var i = 0; i < EXPECTED.length; i++) {
    if (order[i] === EXPECTED[i]) continue;
    t.fail(
      'На месте ' +
        (i + 1) +
        ' стоит «' +
        (NAMES[order[i]] || '—') +
        '», а должен быть «' +
        NAMES[EXPECTED[i]] +
        '». ' +
        REASONS[EXPECTED[i]],
    );
  }
  return 'Порядок как надо';
});

check('semantic-tags', 'Образ и заголовок размечены своими тегами', function (t) {
  var image = t.$('[data-block="image"]');
  var headline = t.$('[data-block="headline"]');

  t.assert(image && image.tagName.toLowerCase() === 'figure', 'Изображение с подписью размечают тегом <figure>.');
  t.assert(headline && headline.tagName.toLowerCase() === 'header', 'Шапку первого экрана размечают тегом <header>.');
  return 'Смысловые теги на месте';
});
