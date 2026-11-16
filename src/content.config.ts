import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const status = z.enum(['draft', 'published']);
const nullableDate = z.union([z.string(), z.date()]).nullable();
const common = {
  id,
  title: z.string().min(1),
  status,
  updated: z.union([z.string(), z.date()]),
  order: z.number().int(),
};
const timeline = {
  organization: z.string().nullable(),
  role: z.string().nullable(),
  period_start: nullableDate,
  period_end: nullableDate,
  ongoing: z.boolean(),
};

const projects = defineCollection({
  loader: glob({ base: './content/projects', pattern: '**/*.md' }),
  schema: z.object({
    ...common,
    featured: z.boolean(),
    summary: z.string().min(1),
    category: z.string().min(1),
    role: z.string().min(1),
    period_start: nullableDate,
    period_end: nullableDate,
    ongoing: z.boolean(),
    team_size: z.number().int().positive().nullable(),
    skills: z.array(id),
    cover: z.unknown().nullable(),
    assets: z.array(z.unknown()),
  }),
});

const education = defineCollection({
  loader: glob({ base: './content/education', pattern: '**/*.md' }),
  schema: z.object({ ...common, ...timeline }),
});

const experience = defineCollection({
  loader: glob({ base: './content/experience', pattern: '**/*.md' }),
  schema: z.object({ ...common, ...timeline, related_projects: z.array(id) }),
});

const certifications = defineCollection({
  loader: glob({ base: './content/certifications', pattern: '**/*.md' }),
  schema: z.object({
    ...common,
    issuer: z.string().nullable(),
    issued: nullableDate,
    expires: nullableDate,
    verification_url: z.string().url().nullable(),
    assets: z.array(z.unknown()),
  }),
});

export const collections = { projects, education, experience, certifications };
