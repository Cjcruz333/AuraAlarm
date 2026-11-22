import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(scriptDir, '..');
const outputDir = path.join(clientDir, 'dist');
const seoDir = path.join(clientDir, 'seo', 'firebase');

mkdirSync(outputDir, { recursive: true });

for (const file of ['robots.txt', 'sitemap.xml']) {
  copyFileSync(path.join(seoDir, file), path.join(outputDir, file));
}
