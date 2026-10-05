#!/usr/bin/env node
/* =============================================================================
   build-project-list.mjs — writes a plain-HTML copy of the portfolio, for
   search engines and AI tools that don't run JavaScript.

   The portfolio grid is built in the browser by js/portfolio.js, so a crawler
   that reads the page without running scripts would see no projects at all.
   This script reads js/projects.js and writes a simple list of every project
   (title, year, tags, description, links, awards) into:

     • index.html, between the PROJECT LIST START / END comments inside the
       grid. Visitors never see it: js/portfolio.js replaces it with the tiles,
       and a line in the <head> hides it before the page draws.
     • llms.txt, between the WORK START / END comments: the same list as
       plain text, for AI tools that read that file.

   RUN IT after you edit js/projects.js, from the repo folder:

     node tools/build-project-list.mjs

   Then commit index.html and llms.txt along with projects.js.
   (Pass a different page to update instead, e.g. `… --page other.html`.)
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.jakesteinberg.com/';            // for full links in llms.txt
const BOOK_URL = 'https://beltpublishing.com/products/the-twin-cities-in-50-maps';

// the main link's wording, by linkType — the same as on the panels' buttons
const LINK_LABEL = { story: 'Read the story', page: 'Open the project',
                     file: 'View the full map', project: 'View the project' };

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const PAGE = join(ROOT, arg('--page') || 'index.html');
const LLMS = join(ROOT, arg('--llms') || 'llms.txt');


/* ---------------------------------------------------------------------------
   Read the projects. projects.js is a plain browser script that declares
   TAGS and PROJECTS, so run it in a sandbox and hand those two back.
   --------------------------------------------------------------------------- */
const source = readFileSync(join(ROOT, 'js/projects.js'), 'utf8');
const { TAGS, PROJECTS } = runInNewContext(source + '\n;({ TAGS, PROJECTS })', {});
const tagLabel = (id) => (TAGS.find((t) => t.id === id) || { label: id }).label;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (html) => String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&mdash;/g, '—')
  .replace(/&ndash;/g, '–').replace(/\s+/g, ' ').trim();
const full = (url) => /^https?:/.test(url) ? url : SITE + url;   // own pages → full address

// each project's links: the main one, then any list of stories, then the book
function linksOf(p) {
  const out = [];
  if (p.link) out.push({ label: LINK_LABEL[p.linkType] || 'Open', url: p.link });
  (p.links || []).forEach((l) => out.push({ label: l.label, url: l.url }));
  if (p.inBook) out.push({ label: 'In the book: The Twin Cities in 50 Maps', url: BOOK_URL });
  return out;
}
const awardsOf = (p) => (p.awards || []).map((a) => typeof a === 'string' ? a : a.award);


/* ---------------------------------------------------------------------------
   index.html — one <li> per project
   --------------------------------------------------------------------------- */
const items = PROJECTS.map((p) => {
  const meta = [p.year, p.tags.map(tagLabel).join(', ')].filter(Boolean).join(' · ');
  const links = linksOf(p).map((l) =>
    `          <li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join('\n');
  const awards = awardsOf(p).map((a) => `        <p>&#9733; ${a}</p>`).join('\n');
  return [
    '      <li>',
    `        <h3>${esc(p.title)}</h3>`,
    meta ? `        <p>${esc(meta)}</p>` : '',
    p.description ? `        <p>${p.description}</p>` : '',
    awards,
    links ? `        <ul>\n${links}\n        </ul>` : '',
    '      </li>'
  ].filter(Boolean).join('\n');
}).join('\n');

const listHTML = `<!-- PROJECT LIST START — written by tools/build-project-list.mjs from
         js/projects.js. Don't edit by hand: run that script instead. -->
      <ol class="plist">
${items}
      </ol>
      <!-- PROJECT LIST END -->`;

replaceBetween(PAGE, /<!-- PROJECT LIST START[\s\S]*?<!-- PROJECT LIST END -->/, listHTML);


/* ---------------------------------------------------------------------------
   llms.txt — the same, as Markdown
   --------------------------------------------------------------------------- */
const md = PROJECTS.map((p) => {
  const head = `### ${p.title}` + (p.year ? ` (${p.year})` : '');
  const lines = [head, '', `Tags: ${p.tags.map(tagLabel).join(', ')}`];
  if (p.description) lines.push('', plain(p.description));
  awardsOf(p).forEach((a) => lines.push('', `Award: ${plain(a)}`));
  const links = linksOf(p);
  if (links.length) lines.push('', ...links.map((l) => `- [${plain(l.label)}](${full(l.url)})`));
  return lines.join('\n');
}).join('\n\n');

replaceBetween(LLMS, /<!-- WORK START[\s\S]*?<!-- WORK END -->/,
  `<!-- WORK START — written by tools/build-project-list.mjs from js/projects.js -->\n\n${md}\n\n<!-- WORK END -->`);


function replaceBetween(file, pattern, text) {
  const before = readFileSync(file, 'utf8');
  if (!pattern.test(before)) {
    console.error(`Couldn't find the START / END comments in ${file} — nothing changed there.`);
    process.exitCode = 1;
    return;
  }
  const after = before.replace(pattern, () => text);
  writeFileSync(file, after);
  console.log(`${after === before ? 'Unchanged' : 'Updated'}: ${file.replace(ROOT + '/', '')} (${PROJECTS.length} projects)`);
}
