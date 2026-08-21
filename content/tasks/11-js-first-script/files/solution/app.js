const button = document.querySelector('#toggle');
const status = document.querySelector('#status');

let isOpen = false;

button.addEventListener('click', function () {
  isOpen = !isOpen;
  status.textContent = isOpen ? 'Открыто' : 'Закрыто';
  console.log('Статус теперь:', status.textContent);
});
