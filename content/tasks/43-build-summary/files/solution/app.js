const button = document.querySelector('#book');
const seats = document.querySelector('#seats');

let left = 4;

button.addEventListener('click', function () {
  if (left === 0) return;

  left -= 1;
  seats.textContent = left > 0 ? 'Свободных мест: ' + left : 'Мест больше нет';

  if (left === 0) {
    button.textContent = 'Всё занято';
    button.disabled = true;
  }
});
