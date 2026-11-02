#!/usr/bin/env node

/**
 * nn-video-script/test/draft-template-preset-only.test.mjs
 *
 * "No Control Without Effect": the standalone draft console exposes only the preset
 * selector. Every non-preset control whose override the script build discards is gone
 * (video-console-views "No Control Without Effect", Slice 0 of V_0-14-x).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'draft-template.html'), 'utf8');

test('no non-preset control remains in the draft console', () => {
  assert.doesNotMatch(TEMPLATE, /data-vparam=/, 'no video parameter input');
  assert.doesNotMatch(TEMPLATE, /data-sc-param=/, 'no scene parameter input');
});

test('the preset selector is still offered at video and scene level', () => {
  assert.match(TEMPLATE, /presetSelectorHtml\("video"\)/);
  assert.match(TEMPLATE, /presetSelectorHtml\(sc\.slug\)/);
});

test('the built script no longer claims overrides no control can produce', () => {
  assert.doesNotMatch(TEMPLATE, /out\.push\('background_audio_volume:: '/);
  assert.doesNotMatch(TEMPLATE, /out\.push\('transition:: '/);
});
