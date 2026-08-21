import ru from '../locales/ru.json';

/**
 * Мини-i18n. Сейчас язык один, но весь текст интерфейса уже вынесен в
 * locales/<lang>.json, поэтому добавление английского — это новый файл
 * и переключатель, а не переписывание кода.
 */

type Dictionary = Record<string, string>;

const dictionaries: Record<string, Dictionary> = { ru };

let current = 'ru';

export function setLocale(locale: string): void {
  if (dictionaries[locale]) current = locale;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const template = dictionaries[current][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
