/*
  Первое задание главы. Две проверки читают вычисленные стили и работают
  везде, остальные меряют реальную геометрию — и потому браузерные.
*/
var TEXT = '.hero__title, .hero__lead, .hero__note';

check('not-centered', 'Текст больше не выровнен по центру', function (t) {
  var align = t.style('.hero__text', 'text-align');
  t.assert(align, 'Не нашёл блок с текстом .hero__text — не меняй классы в разметке.');
  t.assert(
    align !== 'center',
    'Текст всё ещё выровнен по центру. Пока это так, у каждой строки свой левый край, и глаз ищет начало заново на каждой строке.',
  );
  return 'Выравнивание: ' + align;
});

check('two-columns', 'Первый экран разложен на две колонки', function (t) {
  var display = t.style('.hero', 'display');
  t.assert(display, 'Не нашёл .hero — не меняй классы в разметке.');
  t.assert(
    display === 'flex',
    'Текст и картинка идут друг под другом (display: ' +
      display +
      '). Чтобы поставить их рядом, .hero нужен display: flex — это уже было в задании «Блоки в ряд».',
  );
  return 'Колонки собраны на flex';
});

check.browser('one-left-edge', 'Все строки начинаются в одной точке', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var edges = t.layout.leftEdges(TEXT);
  t.assert(edges.length >= 2, 'Не нашёл текст первого экрана.');

  var spread = t.layout.spread(edges);
  t.assert(
    spread <= 2,
    'Левые края строк разъехались на ' +
      Math.round(spread) +
      'px. Ровный левый край — это невидимая линия, вдоль которой глаз спускается вниз; пока края пляшут, её нет.',
  );
  return 'Левый край один на всех, разброс ' + Math.round(spread) + 'px';
});

check.browser('calm-gaze', 'Взгляд идёт вниз, а не мечется', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var path = t.layout.gaze(TEXT);
  t.assert(path.points.length >= 3, 'Строк слишком мало, чтобы говорить о ритме чтения.');

  t.assert(
    path.meanJump <= 4,
    'Между строками взгляд прыгает по горизонтали в среднем на ' +
      Math.round(path.meanJump) +
      'px, а самый длинный прыжок — ' +
      Math.round(path.maxJump) +
      'px. Нажми «Путь взгляда» и посмотри, как курсор мечется. При едином левом крае прыжков нет вовсе.',
  );
  return 'Путь взгляда ровный: ' + path.points.length + ' строк без прыжков';
});

check.browser('media-aside', 'Картинка стоит сбоку от текста', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var media = t.rect('.hero__media');
  var text = t.rect('.hero__text');
  t.assert(media.width > 0, 'Картинка не загрузилась — файл pot.svg лежит рядом с index.html.');

  t.assert(
    media.left >= text.right - 1,
    'Картинка не ушла вправо: она начинается на ' +
      Math.round(media.left) +
      'px, а текстовая колонка кончается на ' +
      Math.round(text.right) +
      'px. Асимметрия в том и состоит, что текст и графика делят экран, а не встают друг под другом.',
  );
  return 'Текст слева, картинка справа';
});
