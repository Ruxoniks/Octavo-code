import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/editor.css';
import './styles/map.css';

/**
 * Контент подгружается на этапе сборки, и ошибка в манифесте задания
 * ломает импорт целиком. Динамический импорт нужен, чтобы показать
 * контрибьютору понятное сообщение вместо пустой страницы.
 */
async function boot(): Promise<void> {
  const root = document.getElementById('app');
  try {
    const { start } = await import('./app');
    start();
  } catch (error) {
    if (root) {
      root.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'map';
      const title = document.createElement('h1');
      title.textContent = 'Не удалось загрузить контент';
      const message = document.createElement('pre');
      message.textContent = (error as Error).message;
      box.append(title, message);
      root.appendChild(box);
    }
    throw error;
  }
}

void boot();
