import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const root = process.cwd();
const errors = [];
const warnings = [];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validStatus = new Set(['draft', 'published']);

function frontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('缺少有效 YAML frontmatter');
  return { data: parse(match[1]), body: match[2] };
}

function records(folder) {
  const dir = path.join(root, 'content', folder);
  return fs.readdirSync(dir).filter((name) => name.endsWith('.md')).map((name) => {
    const file = path.join(dir, name);
    try { return { file, name, ...frontmatter(file) }; }
    catch (error) { errors.push(`${path.relative(root, file)}：${error.message}`); return null; }
  }).filter(Boolean);
}

const groups = {
  projects: records('projects'),
  education: records('education'),
  experience: records('experience'),
  certifications: records('certifications'),
};
const all = Object.values(groups).flat();
const seen = new Map();

for (const item of all) {
  const rel = path.relative(root, item.file);
  for (const field of ['id', 'title', 'status', 'updated', 'order']) {
    if (item.data[field] === undefined || item.data[field] === null || item.data[field] === '') errors.push(`${rel}：缺少 ${field}`);
  }
  if (!idPattern.test(item.data.id ?? '')) errors.push(`${rel}：id 必須是 kebab-case`);
  if (path.basename(item.name, '.md') !== item.data.id) errors.push(`${rel}：檔名必須與 id 相同`);
  if (!validStatus.has(item.data.status)) errors.push(`${rel}：status 只能是 draft 或 published`);
  if (!Number.isInteger(item.data.order)) errors.push(`${rel}：order 必須是整數`);
  if (seen.has(item.data.id)) errors.push(`${rel}：id 與 ${seen.get(item.data.id)} 重複`); else seen.set(item.data.id, rel);
}

const profile = parse(fs.readFileSync(path.join(root, 'content/profile.yaml'), 'utf8'));
const skills = parse(fs.readFileSync(path.join(root, 'content/skills.yaml'), 'utf8'));
const publishedProjectIds = new Set(groups.projects.filter((item) => item.data.status === 'published').map((item) => item.data.id));
const allProjectIds = new Set(groups.projects.map((item) => item.data.id));
const skillIds = new Set();

z.object({
  name: z.string().min(1), headline: z.string().min(1), hero_intro: z.string().min(1),
  about: z.array(z.string().min(1)).min(1), contact: z.object({ email: z.string().email().nullable() }),
}).passthrough().safeParse(profile).error?.issues.forEach((issue) => errors.push(`content/profile.yaml：${issue.path.join('.')} ${issue.message}`));

for (const skill of skills) {
  if (!idPattern.test(skill.id ?? '')) errors.push(`content/skills.yaml：無效技能 id ${skill.id}`);
  if (skillIds.has(skill.id)) errors.push(`content/skills.yaml：技能 id 重複 ${skill.id}`);
  skillIds.add(skill.id);
  for (const projectId of skill.project_ids ?? []) {
    if (!publishedProjectIds.has(projectId)) warnings.push(`技能 ${skill.id} 未公開連結：${projectId}`);
  }
}

for (const project of groups.projects) {
  const rel = path.relative(root, project.file);
  for (const field of ['featured', 'summary', 'category', 'role', 'ongoing', 'skills', 'assets']) {
    if (project.data[field] === undefined) errors.push(`${rel}：缺少 ${field}`);
  }
  for (const skillId of project.data.skills ?? []) if (!skillIds.has(skillId)) errors.push(`${rel}：引用不存在的技能 ${skillId}`);
  const headings = [...project.body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
  if (headings.length < 7) errors.push(`${rel}：案例內容需包含七個核心章節`);
  if (project.data.status === 'draft' && project.data.featured) errors.push(`${rel}：draft 不可設為 featured`);
  for (const asset of project.data.assets ?? []) {
    if (asset?.public !== true) continue;
    const assetPath = path.join(root, 'public', String(asset.path ?? '').replace(/^\//, ''));
    if (!fs.existsSync(assetPath)) errors.push(`${rel}：公開素材不存在 ${asset.path}`);
  }
}

for (const trait of profile.traits ?? []) for (const projectId of trait.project_ids ?? []) {
  if (!publishedProjectIds.has(projectId)) errors.push(`content/profile.yaml：特質「${trait.title}」引用草稿或不存在案例 ${projectId}`);
}

for (const item of groups.experience) for (const projectId of item.data.related_projects ?? []) {
  if (!publishedProjectIds.has(projectId)) errors.push(`${path.relative(root, item.file)}：related_projects 引用草稿或不存在案例 ${projectId}`);
}

if (allProjectIds.size === 0) errors.push('content/projects：至少需要一篇案例');
if (groups.projects.filter((item) => item.data.status === 'published' && item.data.featured).length > 3) warnings.push('首頁精選超過三篇，僅顯示 order 最前的三篇。');

if (errors.length) {
  console.error(`內容驗證失敗（${errors.length} 項）`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`內容驗證通過：${all.length} 筆 Markdown、${skills.length} 項技能，id 與公開關聯有效。`);
if (warnings.length) {
  console.log(`非阻擋提醒（${warnings.length} 項）：`);
  warnings.forEach((warning) => console.log(`- ${warning}`));
}
