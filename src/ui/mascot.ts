/**
 * Маскот игры — курсор мыши.
 *
 * Здесь он живёт для интерфейса; внутри песочницы курсор рисует
 * runtime.js своей копией разметки — рантайм обязан быть самодостаточным,
 * потому что исполняется в другом origin и ничего отсюда импортировать не может.
 */
export const CURSOR_PATH = 'M5 2.5 L5 27.5 L11.6 21.2 L15.7 30.4 L20.2 28.3 L16.2 19.4 L24 19.4 Z';

export interface CursorOptions {
  size?: number;
  className?: string;
  /** Обводка нужна там, где фон непредсказуем. */
  outlined?: boolean;
}

export function cursorSvg({ size = 24, className = '', outlined = false }: CursorOptions = {}): string {
  const height = Math.round((size * 34) / 28);
  const stroke = outlined ? ' stroke="var(--paper, #fff9e4)" stroke-width="2" stroke-linejoin="round"' : '';
  return (
    `<svg class="${className}" viewBox="0 0 28 34" width="${size}" height="${height}" ` +
    `aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="${CURSOR_PATH}" fill="currentColor"${stroke} /></svg>`
  );
}
