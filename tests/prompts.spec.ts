import { describe, expect, it } from 'vitest';
import { parsePrompt, prompts, promptTags, searchPrompts } from '../src/core/prompts';

describe('разбор файла промпта', () => {
  const source = [
    '---',
    'title: Объясни этот код',
    'summary: Когда непонятно, что происходит.',
    'tags: чтение кода, обучение',
    '---',
    '',
    'Текст запроса.',
    '',
    'Вторая строка.',
  ].join('\n');

  it('читает заголовок, описание и теги', () => {
    const prompt = parsePrompt('01-explain', source);
    expect(prompt.title).toBe('Объясни этот код');
    expect(prompt.summary).toBe('Когда непонятно, что происходит.');
    expect(prompt.tags).toEqual(['чтение кода', 'обучение']);
    expect(prompt.body).toBe('Текст запроса.\n\nВторая строка.');
  });

  it('переживает файл без заголовка: имя файла становится названием', () => {
    const prompt = parsePrompt('без-шапки', 'Просто текст запроса.');
    expect(prompt.title).toBe('без-шапки');
    expect(prompt.tags).toEqual([]);
    expect(prompt.body).toBe('Просто текст запроса.');
  });
});

describe('архив промптов', () => {
  it('в архиве есть промпты и у каждого заполнены поля', () => {
    expect(prompts.length).toBeGreaterThan(0);

    for (const prompt of prompts) {
      expect(prompt.title.length, `${prompt.id}: нет заголовка`).toBeGreaterThan(3);
      expect(prompt.summary.length, `${prompt.id}: нет описания`).toBeGreaterThan(10);
      expect(prompt.tags.length, `${prompt.id}: нет тегов`).toBeGreaterThan(0);
      expect(prompt.body.length, `${prompt.id}: пустой текст запроса`).toBeGreaterThan(50);
    }
  });

  it('идентификаторы уникальны', () => {
    const ids = prompts.map((prompt) => prompt.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('поиск фильтрует по тексту и по тегу', () => {
    const tag = promptTags()[0];
    expect(searchPrompts('', tag).every((prompt) => prompt.tags.includes(tag))).toBe(true);
    expect(searchPrompts('ЗАВЕДОМО-НЕСУЩЕСТВУЮЩЕЕ-СЛОВО')).toEqual([]);
    expect(searchPrompts('').length).toBe(prompts.length);
  });
});
