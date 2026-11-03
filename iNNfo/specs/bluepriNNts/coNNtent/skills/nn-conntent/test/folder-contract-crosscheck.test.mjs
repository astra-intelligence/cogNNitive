/**
 * nn-conntent/test/folder-contract-crosscheck.test.mjs
 *
 * The names `references/folder-contract.md` promises agree with the code that
 * produces them, so renaming a file in either place fails here. Each name is looked
 * up in the doc AND in the source that owns it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(SKILL, rel), 'utf8');

const doc = read('references/folder-contract.md');
const layout = /```\n([\s\S]*?)```/.exec(doc)?.[1] ?? '';

test('the doc has a canonical layout block', () => {
  assert.ok(layout.includes('series/<s>/'), 'the layout block lists the episode tree');
});

test('master suffix: doc and finalize-video agree', () => {
  const suffix = /const MASTER_SUFFIX = '([^']+)'/.exec(read('scripts/finalize-video.mjs'))?.[1];
  assert.equal(suffix, '_1920x1920.mp4');
  assert.ok(layout.includes('<slug>_<W>x<H>.mp4'), 'the layout names the master as <slug>_<W>x<H>.mp4');
  assert.ok(doc.includes('`<slug>_<W>x<H>.mp4`'), 'the prose names the master');
});

test('fixed draft names: the draft tools agree, with no slug or version tag', () => {
  const builder = read('scripts/build-draft-html.mjs');
  for (const name of ["'reviewed.json'", "'review_console.html'", "'draft_thumbs'"]) {
    assert.ok(builder.includes(name), `build-draft-html.mjs uses ${name}`);
  }
  const template = read('scripts/draft-template.html');
  assert.ok(template.includes("'review_console.html'") && template.includes('"reviewed.json"'), 'the console downloads use the fixed names');
  assert.ok(read('scripts/build-script-from-draft.mjs').includes('reviewed.json'), 'the script builder takes reviewed.json');
  assert.doesNotMatch(doc, /_draft_|<slug>_reviewed|<slug>_review_console/);
});

test('hyperframes/ entries: doc and engine agree', () => {
  const engine = read('scripts/video-engine-cli.mjs');
  for (const [name, inCode] of [['manifest.json', "'manifest.json'"], ['hyperframes', "'hyperframes'"]]) {
    assert.ok(layout.includes(name), `${name} is in the doc layout`);
    assert.ok(engine.includes(inCode), `video-engine-cli.mjs writes ${inCode}`);
  }
  assert.match(doc, /no `build\/`/, 'the doc states there is no build/ directory');
  assert.doesNotMatch(layout, /build\//, 'the layout block names no build/ folder');
});

test('description.md: doc and the chapter printer agree', () => {
  assert.ok(layout.includes('description.md'), 'description.md is in the doc layout');
  assert.ok(read('scripts/lib/description.mjs').includes('`description.md`'), 'the chapter block is documented as description.md');
  assert.ok(read('scripts/finalize-video.mjs').includes('description.md'), 'finalize prints chapters for description.md');
});

test('render.tmp.mp4: doc and the render step agree', () => {
  assert.ok(layout.includes('render.tmp.mp4'));
  assert.match(doc, /`render\.tmp\.mp4` during a render/);
  assert.ok(read('scripts/video-engine-cli.mjs').includes("'render.tmp.mp4'"), 'video-engine-cli.mjs renders through render.tmp.mp4');
});
