import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const htmlFiles = [];
const configuredBase = (process.env.BASE_PATH || '/portfolio-content').replace(/^\/+|\/+$/g, '');

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

function outputFor(urlPath) {
  let clean = decodeURI(urlPath.split('#')[0].split('?')[0]).replace(/^\//, '');
  if (configuredBase && (clean === configuredBase || clean.startsWith(`${configuredBase}/`))) {
    clean = clean.slice(configuredBase.length).replace(/^\//, '');
  }
  const direct = path.join(dist, clean);
  if (path.extname(direct)) return direct;
  return clean.endsWith('/') || !clean ? path.join(direct, 'index.html') : `${direct}.html`;
}

if (!fs.existsSync(dist)) failures.push('dist/ 不存在，請先執行 npm run build。');
else walk(dist);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const link of links) {
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(link)) continue;
    const target = link.startsWith('/') ? outputFor(link) : outputFor(new URL(link, `https://local/${path.relative(dist, file).replace(/\\/g, '/')}`).pathname);
    if (!fs.existsSync(target)) failures.push(`${path.relative(dist, file)}：找不到本機連結 ${link}`);
  }
}

const projectDir = path.join(root, 'content/projects');
for (const name of fs.readdirSync(projectDir).filter((file) => file.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(projectDir, name), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const data = parse(match[1]);
  if (data.status !== 'draft') continue;
  const route = path.join(dist, 'projects', data.id, 'index.html');
  if (fs.existsSync(route)) failures.push(`草稿產生了正式頁面：projects/${data.id}/`);
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes(`/projects/${data.id}/`)) failures.push(`${path.relative(dist, file)}：連向草稿 ${data.id}`);
  }
}

if (failures.length) {
  console.error(`輸出檢查失敗（${failures.length} 項）`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`輸出檢查通過：${htmlFiles.length} 個 HTML，內部連結有效，草稿未輸出。`);
