import { z } from 'zod';

/**
 * Схемы валидации контента. Используются и в dev-режиме, и в тестах:
 * кривой манифест от контрибьютора падает в CI, а не у пользователя.
 */

const hint = z.object({
  level: z.number().int().min(1).max(5),
  text: z.string().min(3),
});

const question = z.object({
  id: z.string().min(1),
  prompt: z.string().min(3),
  kind: z.enum(['line', 'choice']),
  options: z.array(z.string()).optional(),
  answer: z.number().int().min(0),
  explain: z.string().min(3),
});

const mascotConfig = z.object({
  mode: z.enum(['ladder', 'walk', 'off']),
  target: z.string().optional(),
  maxRise: z.number().optional(),
  maxGap: z.number().optional(),
  goal: z.string().optional(),
  speed: z.number().optional(),
});

export const taskManifestSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id: только строчные латинские буквы, цифры и дефис'),
    chapter: z.string().min(1),
    order: z.number().int().min(0),
    type: z.enum(['code', 'dnd', 'read', 'ai', 'terminal']),
    title: z.string().min(3),
    summary: z.string().min(3),
    difficulty: z.number().int().min(1).max(5),
    estimateMin: z.number().int().min(1).max(180),
    requires: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    allowAi: z.boolean().optional(),
    editor: z
      .object({
        files: z.array(z.string()).optional(),
        readonly: z.array(z.string()).optional(),
        primary: z.string().optional(),
        tabSize: z.number().optional(),
        wrap: z.boolean().optional(),
      })
      .optional(),
    preview: z
      .object({
        entry: z.string().optional(),
        autorun: z.boolean().optional(),
        timeoutMs: z.number().optional(),
        mascot: mascotConfig.optional(),
      })
      .optional(),
    hints: z.array(hint).optional(),
    hintsConfig: z.object({ maxLevels: z.number().optional(), allowSolution: z.boolean().optional() }).optional(),
    dnd: z
      .object({
        pool: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            tag: z.string(),
            description: z.string().optional(),
          }),
        ),
        correct: z.array(z.string()).min(2),
      })
      .optional(),
    read: z.object({ file: z.string(), questions: z.array(question).min(1) }).optional(),
    ai: z
      .object({
        goal: z.string().min(3),
        targetFiles: z.array(z.string()).min(1),
        review: z.array(question).optional(),
        requirements: z.array(z.string()).optional(),
      })
      .optional(),
    terminal: z
      .object({
        home: z.string().optional(),
        cwd: z.string().optional(),
        files: z
          .record(z.object({ type: z.enum(['dir', 'file']), content: z.string().optional() }))
          .optional(),
        git: z
          .object({
            initialized: z.boolean().optional(),
            branch: z.string().optional(),
            commits: z.array(z.object({ message: z.string(), files: z.array(z.string()) })).optional(),
            remote: z.string().optional(),
            pushed: z.boolean().optional(),
            snapshot: z.record(z.string()).optional(),
          })
          .optional(),
        paste: z
          .array(
            z.object({
              command: z.string().min(1),
              label: z.string().min(3),
              pattern: z.string().min(1),
              hint: z.string().optional(),
            }),
          )
          .optional(),
      })
      .optional(),
    client: z.string().optional(),
  })
  .superRefine((m, ctx) => {
    if (m.type === 'dnd' && !m.dnd) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'type=dnd требует блок dnd' });
    }
    if (m.type === 'read' && !m.read) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'type=read требует блок read' });
    }
    if (m.type === 'ai' && !m.ai) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'type=ai требует блок ai' });
    }
    if (m.type === 'terminal' && !m.terminal) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'type=terminal требует блок terminal' });
    }
    if (m.dnd) {
      const ids = new Set(m.dnd.pool.map((p) => p.id));
      for (const id of m.dnd.correct) {
        if (!ids.has(id)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `dnd.correct ссылается на неизвестный id "${id}"` });
        }
      }
    }
  });

export const chapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(2),
  description: z.string().min(3),
  order: z.number().int().min(0),
  requires: z.array(z.string()).optional(),
});

export const globalConfigSchema = z.object({
  editor: z.object({
    files: z.array(z.string()),
    readonly: z.array(z.string()).optional(),
    primary: z.string().optional(),
    tabSize: z.number(),
    wrap: z.boolean(),
  }),
  preview: z.object({
    entry: z.string(),
    autorun: z.boolean(),
    timeoutMs: z.number(),
    mascot: mascotConfig,
  }),
  hints: z.object({ maxLevels: z.number(), allowSolution: z.boolean() }),
  ai: z.object({
    enabled: z.boolean(),
    chatLinks: z.array(z.object({ label: z.string(), url: z.string().url() })),
  }),
  mascot: z.object({ speed: z.number() }),
  links: z.object({ github: z.string().url() }),
});

export const clientSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  role: z.string().min(2),
  avatar: z.string().min(1),
  brief: z.string().min(10),
  acceptance: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
  revision: z
    .object({
      afterAttempts: z.number().int().min(1),
      message: z.string().min(5),
      acceptance: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
    })
    .optional(),
});
