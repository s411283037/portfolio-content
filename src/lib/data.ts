import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const profileSchema = z.object({
  name: z.string().min(1),
  english_name: z.string().nullable(),
  headline: z.string().min(1),
  target_role: z.string().nullable(),
  hero_intro: z.string().min(1),
  about: z.array(z.string().min(1)).min(1),
  traits: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    project_ids: z.array(id),
  })),
  contact: z.object({
    email: z.string().email().nullable(),
    github: z.string().url().nullable(),
    linkedin: z.string().url().nullable(),
  }),
  resume: z.string().nullable(),
  photo: z.string().nullable(),
});

const skillSchema = z.object({
  id,
  name: z.string().min(1),
  category: z.string().min(1),
  usage: z.string().min(1),
  project_ids: z.array(id),
  tools: z.array(z.string()),
});

function loadYaml(file: string) {
  return parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

export const profile = profileSchema.parse(loadYaml('content/profile.yaml'));
export const skills = z.array(skillSchema).parse(loadYaml('content/skills.yaml'));

export function groupSkills() {
  return skills.reduce((groups, skill) => {
    const list = groups.get(skill.category) ?? [];
    list.push(skill);
    groups.set(skill.category, list);
    return groups;
  }, new Map<string, typeof skills>());
}

export function formatPeriod(start: unknown, end: unknown, ongoing: boolean) {
  const normalize = (value: unknown) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 7).replace('-', '.');
    return String(value).slice(0, 7).replace('-', '.');
  };
  const from = normalize(start);
  const to = ongoing ? '至今' : normalize(end);
  if (from && to) return `${from} — ${to}`;
  return from || to || null;
}

export function href(pathname = '') {
  const base = import.meta.env.BASE_URL;
  return `${base}${pathname}`.replace(/\/+/g, '/');
}
