import { describe, expect, it } from 'vitest';
import { parseBeats } from '../src/ui/briefBeats';
import { getTask } from '../src/core/registry';

describe('реплики брифа', () => {
  it('делит текст по разделителям и запоминает говорящего', () => {
    const beats = parseBeats('[КУРСОР]\nРаз\n\n---\n\n[ЛОГИКА]\nДва\n\n---\n\nТри');
    expect(beats.map((b) => b.speaker)).toEqual(['КУРСОР', 'ЛОГИКА', 'ЛОГИКА']);
    expect(beats.map((b) => b.markdown)).toEqual(['Раз', 'Два', 'Три']);
  });

  it('не режет по горизонтальной черте внутри блока кода', () => {
    const beats = parseBeats('[КУРСОР]\nВот код:\n\n```css\nhr { border: 0; }\n---\n```\n\nВсё.');
    expect(beats).toHaveLength(1);
  });

  it('старый бриф без разделителей режется по заголовкам', () => {
    const beats = parseBeats('Вступление\n\n## Что нужно сделать\n\nШаги\n\n## Почему важно\n\nПотому что');
    expect(beats).toHaveLength(3);
  });

  it('бриф про лесенку разложен на четыре реплики', () => {
    const beats = parseBeats(getTask('html-ladder')!.brief);
    expect(beats).toHaveLength(4);
  });
});
