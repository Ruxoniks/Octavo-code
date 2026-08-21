import { clear, el } from './dom';

/**
 * Вкладки под диалогом: проверки, подсказки, файлы.
 * Раньше всё это лежало одной лентой, и панель уезжала вниз вместе со страницей.
 */
export interface TabDef {
  id: string;
  label: string;
  body: HTMLElement;
}

export class Tabs {
  readonly element: HTMLElement;
  private bar: HTMLElement;
  private panel: HTMLElement;
  private tabs: TabDef[];
  private active: string;
  private badges = new Map<string, { text: string; tone?: 'ok' | 'fail' }>();

  constructor(tabs: TabDef[], active = tabs[0]?.id) {
    this.tabs = tabs;
    this.active = active ?? '';
    this.bar = el('div', { class: 'tabs__bar', attrs: { role: 'tablist' } });
    this.panel = el('div', { class: 'tabs__panel' });
    this.element = el('div', { class: 'tabs' }, this.bar, this.panel);
    this.render();
  }

  select(id: string): void {
    if (!this.tabs.some((tab) => tab.id === id)) return;
    this.active = id;
    this.render();
  }

  /** Счётчик на вкладке — например, сколько проверок не прошло. */
  setBadge(id: string, text: string | null, tone?: 'ok' | 'fail'): void {
    if (text === null) this.badges.delete(id);
    else this.badges.set(id, { text, tone });
    this.render();
  }

  private render(): void {
    clear(this.bar);
    clear(this.panel);

    for (const tab of this.tabs) {
      const isActive = tab.id === this.active;
      const badge = this.badges.get(tab.id);

      const button = el('button', {
        class: 'tabs__tab',
        attrs: { role: 'tab', 'aria-selected': String(isActive) },
        on: { click: () => this.select(tab.id) },
      });
      button.append(tab.label);
      if (badge) {
        button.appendChild(
          el('span', {
            class: `tabs__badge${badge.tone ? ` tabs__badge--${badge.tone}` : ''}`,
            text: badge.text,
          }),
        );
      }
      this.bar.appendChild(button);
    }

    const current = this.tabs.find((tab) => tab.id === this.active);
    if (current) this.panel.appendChild(current.body);
  }
}
