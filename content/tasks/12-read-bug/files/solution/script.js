const items = ['молоко', 'кофе', 'сахар'];
let message = 'В списке: ';

for (let i = 0; i < items.length; i++) {
  message = message + items[i] + ', ';
}

console.log(message);
