import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const output = new URL('../dist/client/', import.meta.url);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
await access(new URL('index.html', output));

if (basePath) {
  if (!/^\/[a-zA-Z0-9_-]+$/.test(basePath)) throw new Error('Expected a single repository name in NEXT_PUBLIC_BASE_PATH.');
  // Vinext beta emits next/font URLs at the origin even when Vite has a base.
  // Fix only those generated font URLs; Vite handles chunks and stylesheet URLs.
  async function prefixFonts(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await prefixFonts(path);
      else if (/\.(html|rsc|js|css|json)$/.test(entry.name)) {
        const before = await readFile(path, 'utf8');
        const after = before.replace(/(?<![a-zA-Z0-9_/-])\/_next\/static\/_vinext_fonts\//g, `${basePath}/_next/static/_vinext_fonts/`);
        if (after !== before) await writeFile(path, after);
      }
    }
  }
  const { fileURLToPath } = await import('node:url');
  await prefixFonts(fileURLToPath(output));
}

await writeFile(new URL('.nojekyll', output), '');
console.log(`Static site ready${basePath ? ` at ${basePath}/` : ''}.`);
