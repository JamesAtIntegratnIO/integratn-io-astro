// Generates the 1200x630 cards link previews show, into public/og/.
//
// Run it with `npm run og` after changing the wording or a mark. The output is
// committed, so the site build stays a plain `astro build` and CI rasterises
// nothing. Colours are the design system's dark surface (surface.css): ground,
// panel, border, text, said, dim. Signal orange appears only inside the marks.

import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'public/og');
const W = 1200;
const H = 630;

const GROUND = '#0a0c10';
const PANEL = '#1d2126';
const BORDER = '#393e43';
const TEXT = '#f3f7fc';
const SAID = '#cfd5dc';
const DIM = '#acb2b9';
const SANS = 'Inter, Helvetica, Arial, sans-serif';
const MONO = 'DejaVu Sans Mono, Menlo, monospace';

// A mark from public/brand, placed as a nested <svg> at (x, y) and size.
function mark(name, x, y, size) {
  const svg = readFileSync(join(ROOT, 'public/brand', `${name}-mark.svg`), 'utf8');
  return svg
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<svg\b([^>]*)>/, (_, attrs) => {
      const kept = attrs.replace(/\s(width|height|x|y)="[^"]*"/g, '');
      return `<svg${kept} x="${x}" y="${y}" width="${size}" height="${size}">`;
    });
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// The footer every card shares: a hairline, the small Integratn lockup, the address.
function foot(withLockup) {
  return `
  <line x1="80" y1="530" x2="${W - 80}" y2="530" stroke="${BORDER}" stroke-width="2"/>
  ${withLockup ? mark('integratn', 80, 553, 44) : ''}
  ${withLockup ? `<text x="136" y="584" font-family="${SANS}" font-size="26" font-weight="600" fill="${TEXT}">Integratn</text>` : ''}
  <text x="${W - 80}" y="584" text-anchor="end" font-family="${MONO}" font-size="22" fill="${DIM}">integratn.io</text>`;
}

function card(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${GROUND}"/>
  ${body}
</svg>`;
}

const cards = {
  // The front page: the Cover moment, with the mark as its art.
  integratn: card(`
  <text x="80" y="150" font-family="${SANS}" font-size="22" font-weight="600" letter-spacing="3" fill="${DIM}">SYSTEMS / PEOPLE / PROGRESS</text>
  <text x="80" y="262" font-family="${SANS}" font-size="104" font-weight="700" letter-spacing="-2" fill="${TEXT}">Integratn</text>
  <text x="80" y="340" font-family="${SANS}" font-size="38" font-weight="600" fill="${SAID}">Independent parts.</text>
  <text x="80" y="390" font-family="${SANS}" font-size="38" font-weight="600" fill="${SAID}">Engineered together.</text>
  ${mark('integratn', 780, 110, 340)}
  ${foot(false)}`),
};

// A product: its own mark large, the Integratn lockup small in the footer.
function product(name, title, tagline, chip) {
  const chipW = chip ? chip.length * 13 + 36 : 0;
  return card(`
  <rect x="80" y="104" width="196" height="196" rx="8" fill="${PANEL}" stroke="${BORDER}" stroke-width="2"/>
  ${mark(name, 96, 120, 164)}
  <text x="80" y="408" font-family="${SANS}" font-size="88" font-weight="700" letter-spacing="-2" fill="${TEXT}">${esc(title)}</text>
  <text x="80" y="470" font-family="${SANS}" font-size="36" fill="${DIM}">${esc(tagline)}</text>
  ${chip ? `<rect x="316" y="182" width="${chipW}" height="40" rx="20" fill="${PANEL}" stroke="${BORDER}" stroke-width="2"/>
  <text x="${316 + chipW / 2}" y="209" text-anchor="middle" font-family="${SANS}" font-size="20" font-weight="600" fill="${SAID}">${esc(chip)}</text>` : ''}
  ${foot(true)}`);
}

cards.specmarshal = product('specmarshal', 'Specmarshal', 'From spec to software. Under control.', 'Coming soon');
cards.bosun = product('bosun', 'Bosun', 'The crew for Argo and Kargo.', null);

// Greedy word wrap on an average Inter advance; null when it needs more lines.
function wrap(text, size, maxWidth, maxLines) {
  const limit = Math.floor(maxWidth / (size * 0.54));
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > limit && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length <= maxLines ? lines : null;
}

// The largest of the sizes at which the text fits the lines; the smallest, cut, otherwise.
function fit(text, sizes, maxWidth, maxLines) {
  for (const size of sizes) {
    const lines = wrap(text, size, maxWidth, maxLines);
    if (lines) return { size, lines };
  }
  const size = sizes.at(-1);
  return { size, lines: wrap(text, size, maxWidth, Infinity).slice(0, maxLines) };
}

// A blog post: a label, the title, its description, the mark as the art.
// The title takes the largest size that leaves room for two lines of blurb
// above the hairline; the blurb takes what is left, three lines at most.
function post(label, title, blurb) {
  const top = 236; // the title's first baseline
  const room = 208; // from there to the last baseline that clears the hairline
  const blurbSize = 30;
  const blurbLead = 39;
  let t;
  for (const size of [72, 64, 56, 48]) {
    const lines = wrap(title, size, 740, 4);
    if (lines && (lines.length - 1) * Math.round(size * 1.12) + blurbLead <= room) {
      t = { size, lines };
      break;
    }
  }
  t ??= fit(title, [48], 740, 4);
  const lead = Math.round(t.size * 1.12);
  const titleHeight = (t.lines.length - 1) * lead;
  const blurbLines = wrap(blurb, blurbSize, 740, Infinity);
  const shown = blurbLines.slice(0, Math.min(3, Math.floor((room - titleHeight) / blurbLead) + 1));
  if (shown.length < blurbLines.length) shown[shown.length - 1] = shown.at(-1).replace(/[\s,;:.]*$/, '') + '…';
  const blurbTop = top + titleHeight + 30 + blurbSize;
  return card(`
  <text x="80" y="150" font-family="${SANS}" font-size="22" font-weight="600" letter-spacing="3" fill="${DIM}">${esc(label)}</text>
  ${t.lines.map((line, i) => `<text x="80" y="${top + i * lead}" font-family="${SANS}" font-size="${t.size}" font-weight="700" letter-spacing="-1" fill="${TEXT}">${esc(line)}</text>`).join('\n  ')}
  ${shown.map((line, i) => `<text x="80" y="${blurbTop + i * blurbLead}" font-family="${SANS}" font-size="${blurbSize}" fill="${SAID}">${esc(line)}</text>`).join('\n  ')}
  ${mark('integratn', 900, 120, 220)}
  ${foot(false)}`);
}

// Every post whose frontmatter names a `card` gets one at that path under
// public/, titled from the frontmatter. A series post is labelled with its
// series and part, and titled with what follows the part number.
function frontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  for (const line of block ? block[1].split('\n') : []) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = /^".*"$/.test(kv[2].trim()) ? JSON.parse(kv[2].trim()) : kv[2].trim();
  }
  return out;
}

function* markdownFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* markdownFiles(path);
    else if (/\.mdx?$/.test(entry.name)) yield path;
  }
}

const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
for (const file of markdownFiles(join(ROOT, 'src/content/posts'))) {
  const { card: path, title, description = '', series, pubDate } = frontmatter(readFileSync(file, 'utf8'));
  if (!path?.startsWith('/og/')) continue;
  const day = new Date(pubDate).toISOString().slice(0, 10);
  const part = series && title.match(/\d+/)?.[0];
  const label = part ? `${titleCase(series)} / Part ${part} / ${day}`.toUpperCase() : `Blog / ${day}`.toUpperCase();
  const heading = part ? title.replace(/^.*?\d+\s*[-–—:]\s*/, '') : title;
  cards[path.slice('/og/'.length).replace(/\.png$/, '')] = post(label, heading, description);
}

for (const [name, svg] of Object.entries(cards)) {
  mkdirSync(dirname(join(OUT, `${name}.png`)), { recursive: true });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(OUT, `${name}.png`));
  console.log(`public/og/${name}.png`);
}
