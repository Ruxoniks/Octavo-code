/** Крошечные помощники для работы с DOM — вместо фреймворка. */

type Child = Node | string | null | undefined | false;

export interface ElProps {
  class?: string;
  text?: string;
  html?: string;
  attrs?: Record<string, string>;
  on?: Partial<Record<keyof HTMLElementEventMap, (event: never) => void>>;
  [key: string]: unknown;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'html') node.innerHTML = String(value);
    else if (key === 'attrs') {
      for (const [name, attr] of Object.entries(value as Record<string, string>)) {
        node.setAttribute(name, attr);
      }
    } else if (key === 'on') {
      for (const [event, handler] of Object.entries(value as Record<string, EventListener>)) {
        node.addEventListener(event, handler);
      }
    } else {
      (node as unknown as Record<string, unknown>)[key] = value;
    }
  }

  append(node, children);
  return node;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Модальное окно с произвольным содержимым. */
export function modal(title: string, body: Node, footer: Node[] = []): () => void {
  const backdrop = el('div', { class: 'modal-backdrop' });
  const close = (): void => backdrop.remove();

  const box = el(
    'div',
    { class: 'modal' },
    el(
      'div',
      { class: 'modal__header' },
      el('span', { text: title, style: 'flex:1' }),
      el('button', { class: 'ghost', text: '✕', on: { click: close } }),
    ),
    el('div', { class: 'modal__body' }, body),
    footer.length ? el('div', { class: 'modal__footer' }, ...footer) : null,
  );

  backdrop.appendChild(box);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  document.body.appendChild(backdrop);
  return close;
}
