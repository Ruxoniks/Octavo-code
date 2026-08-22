const toggle = document.querySelector('#toggle');
const details = document.querySelector('#details');
const counter = document.querySelector('#counter');

let clicks = 0;

/*
  Русский счёт нельзя собрать одним условием: 1 раз, 2 раза, 5 раз,
  но 11 раз и 21 раз. Сначала смотрим на две последние цифры —
  числа от 11 до 14 всегда «раз», — и только потом на последнюю.
*/
function timesWord(count) {
  const hundred = count % 100;
  if (hundred >= 11 && hundred <= 14) return 'раз';

  const last = count % 10;
  if (last === 1) return 'раз';
  if (last >= 2 && last <= 4) return 'раза';
  return 'раз';
}

toggle.addEventListener('click', function () {
  details.hidden = !details.hidden;
  toggle.textContent = details.hidden ? 'Показать подробности' : 'Скрыть подробности';

  clicks += 1;
  counter.textContent = 'Ты нажал ' + clicks + ' ' + timesWord(clicks);
});
