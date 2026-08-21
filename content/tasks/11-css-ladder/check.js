check('ladder-relative', 'У .ladder есть точка отсчёта', function (t) {
  t.assert(t.$('.ladder'), 'Блок .ladder пропал из разметки.');
  return t.expectStyle(
    '.ladder',
    'position',
    function (value) {
      return value === 'relative' || value === 'absolute' || value === 'fixed';
    },
    'У .ladder position: static, поэтому ступеньки считают координаты от всей страницы'
  );
});

check('steps-absolute', 'Ступеньки позиционированы', function (t) {
  t.assert(t.count('.step') === 5, 'Ожидал пять ступенек в разметке.');
  return t.expectStyle(
    '.step',
    'position',
    'absolute',
    'У .step нет position: absolute, поэтому bottom и left ни на что не влияют'
  );
});

check('steps-have-coordinates', 'У каждой ступеньки заданы свои координаты', function (t) {
  // position задан в готовом CSS: если он вычислился, значит стили в этой
  // среде работают и отсутствие bottom — это уже ошибка ученика, а не среды.
  var probe = t.style('.step', 'position');
  if (!probe) return t.skip('Стили не вычисляются в этой среде');

  var missing = [];
  for (var i = 1; i <= 5; i++) {
    var bottom = t.style('.step--' + i, 'bottom');
    if (!bottom || bottom === 'auto') missing.push(i);
  }
  t.assert(
    missing.length === 0,
    'Не заданы координаты у ступенек: ' + missing.join(', ') + '. Каждой нужен свой bottom.'
  );
  return 'Координаты есть у всех пяти';
});

check.browser('distinct-positions', 'Ступеньки стоят на разной высоте', function (t) {
  var tops = t.$$('.step').map(function (step) {
    return Math.round(t.rect(step).top);
  });
  var unique = tops.filter(function (value, index) {
    return tops.indexOf(value) === index;
  });
  t.assert(
    unique.length === tops.length,
    'Часть ступенек лежит на одной высоте (' + tops.join(', ') + '). Каждой нужен свой bottom.'
  );
  return 'Пять разных высот';
});

check.browser('cursor-climbs', 'Курсор поднимается наверх', function (t) {
  var outcome = t.mascot.canClimb({ target: '.step', maxRise: 90, maxGap: 140 });
  t.assert(outcome.ok, outcome.message);
  return outcome.message;
});

check.browser('reaches-goal', 'Верхняя ступенька достаёт до кнопки', function (t) {
  var steps = t.mascot.steps('.step');
  var goal = t.$('.goal');
  t.assert(goal, 'Кнопка .goal пропала из разметки.');
  var top = steps[steps.length - 1].rect;
  var button = t.rect(goal);
  var distance = top.top - button.bottom;
  t.assert(
    distance <= 60,
    'До кнопки ещё ' + Math.round(distance) + 'px. Подними верхнюю ступеньку ближе к отметке 300px.'
  );
  return 'Кнопка в пределах досягаемости';
});
