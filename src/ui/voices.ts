/**
 * Голоса, которые ведут диалог в брифе задания.
 *
 * Это не персонажи-люди, а роли: маскот подталкивает, логика объясняет
 * механику, память возвращает к пройденному, терминал говорит командами,
 * заказчик приносит требования. Так текст задания читается как разговор,
 * а не как стена документации.
 */
export interface Voice {
  id: string;
  name: string;
  /** Эмодзи-заглушка для тех голосов, у которых нет портрета. */
  glyph?: string;
}

export const DEFAULT_VOICE = 'КУРСОР';

export const voices: Record<string, Voice> = {
  'КУРСОР': { id: 'cursor', name: 'Курсор' },
  'ЛОГИКА': { id: 'logic', name: 'Логика', glyph: '◆' },
  'ПАМЯТЬ': { id: 'memory', name: 'Память', glyph: '◇' },
  'ТЕРМИНАЛ': { id: 'terminal', name: 'Терминал', glyph: '›_' },
  'ЗАКАЗЧИК': { id: 'client', name: 'Заказчик', glyph: '☎' },
};

export function isKnownVoice(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(voices, name);
}

export function voiceOf(name: string): Voice {
  return voices[name] ?? voices[DEFAULT_VOICE];
}
