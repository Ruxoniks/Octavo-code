import { getTask } from './core/registry';
import { notFound, route, startRouter } from './core/router';
import { subscribe } from './core/progress';
import { mount } from './ui/layout';
import { renderMap } from './ui/map';
import { renderPromptsScreen } from './ui/promptsView';
import { renderSettings } from './ui/settings';
import { renderTaskView } from './ui/taskView';
import { el } from './ui/dom';

/** Сборка приложения: маршруты и экраны. */
export function start(): void {
  const root = document.getElementById('app');
  if (!root) throw new Error('Не найден контейнер #app');

  route('/', () => mount(root, renderMap()));
  route('/settings', () => mount(root, renderSettings()));
  route('/prompts', () => mount(root, renderPromptsScreen()));
  route('/task/:id', ({ id }) => {
    const task = getTask(id);
    if (!task) {
      mount(root, el('div', { class: 'screen' }, el('div', { class: 'map' }, el('h1', { text: 'Задание не найдено' }))), {
        back: true,
      });
      return;
    }
    mount(root, renderTaskView(task), { back: true, title: task.manifest.title });
  });
  notFound(() => mount(root, renderMap()));

  // Прогресс влияет на шапку и карту — перерисовываем карту при его изменении.
  subscribe(() => {
    if (location.hash === '' || location.hash === '#/') mount(root, renderMap());
  });

  startRouter();
}
