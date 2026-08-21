/*
  Единственное задание, где проверка нажимает на кнопку сама.
  Проверки идут сверху вниз в одном и том же документе, поэтому счёт нажатий
  здесь общий: press() нажимает и запоминает, сколько раз это было сделано.
*/
var clicks = 0;

function press(t, times) {
  var button = t.$('#toggle');
  t.assert(button, 'Кнопки #toggle нет — не меняй разметку, скрипт опирается на неё.');
  for (var i = 0; i < (times || 1); i++) {
    button.click();
    clicks += 1;
  }
}

function detailsHidden(t) {
  var box = t.$('#details');
  t.assert(box, 'Блока #details нет — не меняй разметку.');
  if (box.hidden) return true;
  var inline = box.style && box.style.display;
  if (inline === 'none') return true;
  return t.style('#details', 'display') === 'none';
}

check('starts-hidden', 'При загрузке подробности спрятаны', function (t) {
  t.assert(
    detailsHidden(t),
    'Подробности видны сразу, хотя человек ещё ничего не нажимал. Кнопка «Показать» рядом с уже показанным текстом выглядит сломанной.',
  );
  return 'Страница открывается свёрнутой';
});

check('toggle-works', 'Кнопка работает в обе стороны', function (t) {
  var before = detailsHidden(t);

  press(t);
  t.assert(
    detailsHidden(t) !== before,
    before
      ? 'Нажал на кнопку — ничего не появилось. Скрытый блок открывают так: details.hidden = false.'
      : 'Нажал на кнопку — подробности остались на экране. Кнопка должна не только показывать, но и прятать.',
  );

  var middle = detailsHidden(t);
  press(t);
  t.assert(
    detailsHidden(t) !== middle,
    'Второе нажатие ничего не изменило. Одна и та же кнопка должна переключать состояние туда и обратно, а не срабатывать один раз.',
  );

  return 'Показывает и прячет';
});

check('button-label', 'Подпись кнопки говорит, что будет дальше', function (t) {
  for (var i = 0; i < 2; i++) {
    press(t);

    var label = t.text('#toggle');
    var lower = label.toLowerCase();

    if (detailsHidden(t)) {
      t.assert(
        lower.indexOf('показ') !== -1,
        'Подробности спрятаны, а на кнопке написано «' +
          label +
          '». Человек читает кнопку как обещание: она должна говорить, что произойдёт после нажатия.',
      );
    } else {
      t.assert(
        lower.indexOf('скры') !== -1 || lower.indexOf('спрят') !== -1,
        'Подробности открыты, а кнопка по-прежнему предлагает «' +
          label +
          '». Подпись должна меняться вместе с блоком.',
      );
    }
  }

  return 'Подпись меняется вместе с блоком';
});

/* Из строки счётчика достаём число и слово после него: «Ты нажал 5 раз» → 5 и «раз». */
function counterParts(t) {
  var text = t.normalize(t.text('#counter'));
  var match = text.match(/(\d+)\s+([а-яё]+)/i);
  return { text: text, count: match ? Number(match[1]) : null, word: match ? match[2].toLowerCase() : null };
}

check('counter-counts', 'Счётчик считает нажатия', function (t) {
  var parts = counterParts(t);
  t.assert(
    parts.count !== null,
    'В счётчике написано «' + parts.text + '» — числа там нет. Заведи переменную и увеличивай её на каждом нажатии.',
  );
  t.assert(
    parts.count === clicks,
    'На кнопку нажали ' + clicks + ' раза, а счётчик насчитал ' + parts.count + '. Проверь, где увеличивается переменная.',
  );
  return 'Счётчик показывает ' + clicks;
});

check('counter-plural', 'Счётчик согласован по-русски', function (t) {
  var cases = [
    { target: 5, word: 'раз' },
    { target: 12, word: 'раз' },
    { target: 21, word: 'раз' },
    { target: 22, word: 'раза' },
    { target: 25, word: 'раз' },
  ];

  for (var i = 0; i < cases.length; i++) {
    var need = cases[i].target - clicks;
    if (need > 0) press(t, need);

    var parts = counterParts(t);
    var explain = '.';

    if (cases[i].target === 12) {
      explain =
        '. Двенадцать — та самая ловушка: последняя цифра двойка, но говорят «12 раз», а не «12 раза». Числа от 11 до 14 всегда «раз», и увидеть это можно только по двум последним цифрам.';
    } else if (cases[i].target === 22) {
      explain = '. А вот 22 — это уже «раза», хотя 12 было «раз». Одной проверкой последней цифры не обойтись.';
    }

    // Сравниваем слово целиком: в строке «5 раза» подстрока «5 раз» тоже есть.
    t.assert(
      parts.count === cases[i].target && parts.word === cases[i].word,
      'После ' +
        cases[i].target +
        ' нажатий в счётчике написано «' +
        parts.text +
        '», а по-русски правильно «' +
        cases[i].target +
        ' ' +
        cases[i].word +
        '»' +
        explain,
    );
  }

  return 'Правильно и на 5, и на 12, и на 22';
});
