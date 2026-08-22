/*
  Струна — это не свойство одного элемента, а совпадение краёв у всех сразу.
  Личные отступы видно и без раскладки, поэтому первая проверка обычная;
  реальные края строк меряются только в браузере.
*/
function personalIndents(t) {
  return t.$$('.about__text > *').map(function (el) {
    return parseFloat(t.style(el, 'margin-left')) || 0;
  });
}

check('no-personal-indents', 'Ни у кого нет своего отступа слева', function (t) {
  var indents = personalIndents(t);
  t.assert(indents.length >= 3, 'Не нашёл содержимое .about__text — не меняй классы в разметке.');

  var spread = t.layout.spread(indents);
  t.assert(
    spread === 0,
    'Личные отступы слева разъехались: ' +
      indents.map(function (n) {
        return Math.round(n) + 'px';
      }).join(', ') +
      '. Каждый из них ставили отдельно и на глаз — по одному они незаметны, вместе дают кашу. Отступ слева должна задавать колонка, а не каждый элемент сам себе.',
  );
  return 'Общий отступ для всех: ' + Math.round(indents[0]) + 'px';
});

check.browser('one-spine', 'Все элементы стоят на одной линии', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  // У текста струну задаёт начало строки, а у кнопки — край её самой:
  // подпись внутри отодвинута собственными полями, и равняются не по ней.
  var edges = t.layout.leftEdges('.about__title, .about__lead, .about__note');
  edges.push(t.rect('.about__action').left);
  t.assert(edges.length >= 3, 'Не нашёл содержимое блока.');

  var spread = t.layout.spread(edges);
  t.assert(
    spread <= 2,
    'Левые края стоят на ' +
      edges.map(function (n) {
        return Math.round(n) + 'px';
      }).join(', ') +
      ' — разброс ' +
      Math.round(spread) +
      'px. Струна провисает: элементы связывает не фон и не рамка, а линия, вдоль которой они выстроены.',
  );
  return 'Струна натянута, разброс ' + Math.round(spread) + 'px';
});

check.browser('right-string', 'Картинка выровнена по правому краю блока', function (t) {
  if (!t.layout.available()) return t.skip('Геометрия не считается в этой среде');

  var media = t.rect('.about__media');
  var block = t.rect('.about');
  t.assert(media.width > 0, 'Картинка не загрузилась — файл wheel.svg лежит рядом с index.html.');

  var padding = parseFloat(t.style('.about', 'padding-right')) || 0;
  var edge = block.right - padding;
  var gap = Math.abs(edge - media.right);

  t.assert(
    gap <= 2,
    'Правый край картинки не дотягивает до правого края блока: разница ' +
      Math.round(gap) +
      'px. Струн в композиции может быть несколько, но каждая должна быть намеренной — а этот отступ никто не задумывал.',
  );
  return 'Правый край блока и картинки совпал';
});
