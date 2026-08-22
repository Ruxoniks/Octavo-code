/*
  Зеркальность видно по разметке: какой элемент стоит первым, тот и слева.
  Порядок в DOM важнее CSS-трюков — программа чтения вслух идёт именно по нему.
*/
check('mirrored', 'Блок зеркалит первый экран', function (t) {
  var block = t.$('.about');
  t.assert(block, 'Не нашёл .about — не меняй классы в разметке.');

  var order = [];
  for (var i = 0; i < block.children.length; i++) {
    var name = String(block.children[i].className).split(' ')[0];
    if (name === 'about__media' || name === 'about__text') order.push(name);
  }

  t.assert(order.length === 2, 'В блоке должны остаться картинка и колонка текста.');
  t.assert(
    order[0] === 'about__media',
    'Картинка по-прежнему идёт после текста, и блок выглядит копией первого экрана. Переставь её выше в разметке: тогда она окажется слева, а текст справа.',
  );
  return 'Картинка слева, текст справа';
});

check('scale', 'Иерархия сохранилась', function (t) {
  var scale = t.layout.fontScale('.about__title', '.about__note');
  t.assert(scale > 0, 'Не удалось прочитать размеры шрифта.');
  t.assert(
    scale >= 2.5,
    'Заголовок крупнее текста в ' +
      scale.toFixed(1) +
      ' раза. Зеркальность меняет сторону, но не отменяет иерархию: заголовок остаётся заголовком.',
  );

  var heading = t.layout.lineHeight('.about__title');
  t.assert(
    heading === null || heading <= 1.25,
    'Межстрочный интервал заголовка ' + (heading || 0).toFixed(2) + ' — крупному кеглю нужен плотный, около 1.1.',
  );
  return 'Контраст ' + scale.toFixed(1) + ' раза';
});

check.browser('flipped', 'Картинка действительно оказалась слева', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var media = t.rect('.about__media');
  var text = t.rect('.about__text');
  t.assert(media.width > 0, 'Картинка не загрузилась — файл wheel.svg лежит рядом с index.html.');

  t.assert(
    media.right <= text.left + 1,
    'Картинка всё ещё справа от текста: она кончается на ' +
      Math.round(media.right) +
      'px, а текст начинается на ' +
      Math.round(text.left) +
      'px.',
  );
  return 'Стороны поменялись местами';
});

check.browser('spine-survived', 'Струна пережила переворот', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var edges = t.layout.leftEdges('.about__title, .about__lead, .about__note');
  var spread = t.layout.spread(edges);

  t.assert(
    spread <= 2,
    'Внутри колонки левые края разъехались на ' +
      Math.round(spread) +
      'px. Сторона поменялась, но правило осталось: у текста один левый край.',
  );
  return 'Струна на месте, разброс ' + Math.round(spread) + 'px';
});
