check('steps-count', 'На странице пять ступенек', function (t) {
  var steps = t.$$('.step');
  t.assert(steps.length > 0, 'Ступенек нет совсем. Ступенька — это <div class="step step--1">1</div>.');
  t.assert(
    steps.length === 5,
    'Нашёл ступенек: ' + steps.length + ', а нужно ровно 5. Проверь, у всех ли <div> есть класс step.'
  );
  return 'Ступенек: 5';
});

check('steps-numbers', 'Номера ступенек идут подряд', function (t) {
  var missing = [];
  var duplicated = [];
  for (var i = 1; i <= 5; i++) {
    var found = t.count('.step--' + i);
    if (found === 0) missing.push(i);
    if (found > 1) duplicated.push(i);
  }
  t.assert(
    missing.length === 0,
    'Не хватает ступенек с номерами: ' + missing.join(', ') + '. Без них в лесенке дыра.'
  );
  t.assert(
    duplicated.length === 0,
    'Номера повторяются: ' + duplicated.join(', ') + '. Две ступеньки в одном месте курсору не помогут.'
  );
  return 'Номера с 1 по 5 на месте';
});

check('steps-inside-ladder', 'Ступеньки лежат внутри блока .ladder', function (t) {
  var ladder = t.$('.ladder');
  t.assert(ladder, 'Блок <div class="ladder"> пропал — верни его, ступеньки позиционируются относительно него.');
  var inside = ladder.querySelectorAll('.step').length;
  t.assert(
    inside === t.count('.step'),
    'Часть ступенек оказалась снаружи .ladder. Позиция считается от родителя, поэтому они улетят не туда.'
  );
  return 'Все ступеньки внутри лесенки';
});

check.browser('cursor-climbs', 'Курсор поднимается наверх', function (t) {
  var outcome = t.mascot.canClimb({ target: '.step', maxRise: 90, maxGap: 140 });
  t.assert(outcome.ok, outcome.message);
  return outcome.message;
});
