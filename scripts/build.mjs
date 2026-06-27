import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { globSync } from 'node:fs';

// Production builds are minified and source maps are disabled to reduce casual code inspection.
// This is not a substitute for backend security. Do not place secrets in frontend code.
// Netlify Forms require form names, field names, query keys, and hidden detection forms to remain intact.
const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const ASSETS = join(DIST, 'assets');

const read = async (path) => (await import('node:fs/promises')).readFile(path, 'utf8');
const hash = (content) => createHash('sha256').update(content).digest('hex').slice(0, 10);
const hashedName = (base, ext, content) => `${base}-${hash(content)}${ext}`;

function stripJsComments(input) {
  let out = '';
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (lineComment) {
      if (char === '\n') { lineComment = false; out += '\n'; }
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') { blockComment = false; i += 1; }
      continue;
    }
    if (quote) {
      out += char;
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; out += char; continue; }
    if (char === '/' && next === '/') { lineComment = true; i += 1; continue; }
    if (char === '/' && next === '*') { blockComment = true; i += 1; continue; }
    out += char;
  }
  return out;
}

function minifyJs(input) {
  return stripJsComments(input)
    .replace(/\/\/#[#@]? sourceMappingURL=.*$/gm, '')
    .replace(/\bdebugger;?/g, '')
    .replace(/\bconsole\.(log|debug|info)\([^;]*\);?/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('');
}

function minifyCss(input) {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function minifyHtml(input, assets) {
  return input
    .replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, '')
    .replace(/href="favicon\.svg"/g, `href="/assets/${assets.favicon}"`)
    .replace(/href="styles\.css"/g, `href="/assets/${assets.css}"`)
    .replace(/src="site-config\.js"/g, `src="/assets/${assets.config}"`)
    .replace(/src="script\.js"/g, `src="/assets/${assets.js}"`)
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

await rm(DIST, { recursive: true, force: true });
await mkdir(ASSETS, { recursive: true });

const css = minifyCss(await read(join(ROOT, 'styles.css')));
const js = minifyJs(await read(join(ROOT, 'script.js')));
const config = minifyJs(await read(join(ROOT, 'site-config.js')));
const favicon = await read(join(ROOT, 'favicon.svg'));

const assets = {
  css: hashedName('styles', '.css', css),
  js: hashedName('script', '.js', js),
  config: hashedName('site-config', '.js', config),
  favicon: hashedName('favicon', '.svg', favicon),
};

await write(join(ASSETS, assets.css), css);
await write(join(ASSETS, assets.js), js);
await write(join(ASSETS, assets.config), config);
await write(join(ASSETS, assets.favicon), favicon.trim());

const htmlFiles = globSync('**/*.html', {
  cwd: ROOT,
  withFileTypes: false,
  exclude: ['dist/**', 'node_modules/**'],
});

for (const file of htmlFiles) {
  const source = await read(join(ROOT, file));
  await write(join(DIST, file), minifyHtml(source, assets));
}

if (existsSync(join(ROOT, '.well-known/security.txt'))) {
  await mkdir(join(DIST, '.well-known'), { recursive: true });
  await copyFile(join(ROOT, '.well-known/security.txt'), join(DIST, '.well-known/security.txt'));
}

console.warn(`Built ${htmlFiles.length} HTML files to dist/ with hashed assets and no source maps.`);
