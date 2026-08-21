import { el, clear, escapeHtml } from '../dom';
import { t } from '../../core/i18n';
import type { DndOption } from '../../core/types';
import type { Runner, RunnerContext } from './index';

/**
 * Сборка страницы из готовых компонентов мышкой.
 *
 * Важная деталь: порядок блоков сразу превращается в настоящую разметку,
 * которая уходит в превью и в проверку. Так видно, что «порядок на странице»
 * — это просто порядок элементов в HTML.
 */
const PLACEHOLDER = '<!-- BLOCKS -->';

function markupFor(option: DndOption): string {
  const description = option.description ? `\n    <p>${escapeHtml(option.description)}</p>` : '';
  return `  <${option.tag} class="block block--${option.id}" data-block="${option.id}">\n    <h2>${escapeHtml(option.label)}</h2>${description}\n  </${option.tag}>`;
}

export function createDndRunner(context: RunnerContext): Runner {
  const config = context.task.manifest.dnd;
  const entry = context.task.preview.entry;
  const template = context.task.files[entry] ?? `<!doctype html>\n<html><body>\n${PLACEHOLDER}\n</body></html>`;

  if (!config) throw new Error('Задание типа dnd без блока dnd в манифесте');

  const poolIds = config.pool.map((option) => option.id);
  let chosen: string[] = [];

  const available = el('div', { class: 'dnd__list' });
  const page = el('div', { class: 'dnd__list' });

  const optionById = new Map(config.pool.map((option) => [option.id, option]));

  const sync = (): void => {
    const blocks = chosen
      .map((id) => optionById.get(id))
      .filter((option): option is DndOption => Boolean(option))
      .map(markupFor)
      .join('\n');
    context.setFile(entry, template.replace(PLACEHOLDER, blocks));
    context.requestPreview();
    render();
  };

  const makeCard = (option: DndOption, where: 'pool' | 'page'): HTMLElement => {
    const card = el(
      'div',
      {
        class: 'dnd__item',
        draggable: true,
        attrs: { 'data-id': option.id },
        on: {
          dragstart: (event: DragEvent) => {
            event.dataTransfer?.setData('text/plain', option.id);
            card.classList.add('dragging');
          },
          dragend: () => card.classList.remove('dragging'),
          dblclick: () => {
            if (where === 'pool') chosen.push(option.id);
            else chosen = chosen.filter((id) => id !== option.id);
            sync();
          },
        },
      },
      el('span', { text: option.label }),
      el('code', { text: `<${option.tag}>` }),
    );
    return card;
  };

  const dropTarget = (list: HTMLElement, onDrop: (id: string, beforeId?: string) => void): void => {
    list.addEventListener('dragover', (event) => {
      event.preventDefault();
      list.classList.add('is-over');
    });
    list.addEventListener('dragleave', () => list.classList.remove('is-over'));
    list.addEventListener('drop', (event) => {
      event.preventDefault();
      list.classList.remove('is-over');
      const id = event.dataTransfer?.getData('text/plain');
      if (!id || !poolIds.includes(id)) return;
      const target = (event.target as HTMLElement).closest('.dnd__item') as HTMLElement | null;
      onDrop(id, target?.dataset.id);
    });
  };

  dropTarget(page, (id, beforeId) => {
    chosen = chosen.filter((item) => item !== id);
    const index = beforeId ? chosen.indexOf(beforeId) : -1;
    if (index === -1) chosen.push(id);
    else chosen.splice(index, 0, id);
    sync();
  });

  dropTarget(available, (id) => {
    chosen = chosen.filter((item) => item !== id);
    sync();
  });

  function render(): void {
    clear(available);
    clear(page);
    for (const option of config!.pool) {
      if (chosen.includes(option.id)) continue;
      available.appendChild(makeCard(option, 'pool'));
    }
    for (const id of chosen) {
      const option = optionById.get(id);
      if (option) page.appendChild(makeCard(option, 'page'));
    }
  }

  render();

  const element = el(
    'div',
    { class: 'dnd' },
    el('div', { class: 'dnd__col' }, el('h3', { text: t('dnd.available') }), available),
    el(
      'div',
      { class: 'dnd__col' },
      el('h3', { text: t('dnd.page') }),
      page,
      el('p', { class: 'dnd__hint', text: t('dnd.hint') }),
    ),
  );

  return {
    element,
    reload: () => render(),
  };
}
