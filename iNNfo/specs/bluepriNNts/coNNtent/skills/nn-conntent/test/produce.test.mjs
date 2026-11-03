#!/usr/bin/env node

/**
 * nn-conntent/test/produce.test.mjs
 *
 * The `produce` state machine against a tmp domaiNN (capability video-produce-command):
 * intake dry-apply, the review stop (10), the budget stop (11), resume, and the engine
 * changesets written through the real apply engine.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { EXIT_BUDGET, EXIT_DONE, EXIT_REVIEW, produce, ProduceStop } from '../scripts/produce.mjs';
import { readEpisode } from '../scripts/lib/episode.mjs';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLUEPRINT = path.resolve(SKILL, '..', '..');

const SCENE = `# NN Scene

## NN Scene: One
slug:: one
kind:: Libre

one two three four five six seven eight nine ten
`;

const episodeDoc = ({ status = 'draft', budget = '1.5', review = 'skip', scenes = SCENE, pin = 'V_0-15-0' } = {}) => `---
level: 3
parent_spec:
  name: "coNNtent_V_0-15-0"
  url: "https://example.invalid/coNNtent/spec_NN.md"
knowledge_version: "V_0-1-0"
blueprint_version: "${pin}"
title: "Probe episode"
---

# NN Video

## NN Video: Probe
slug:: probe
title:: Probe
status:: ${status}${budget === null ? '' : `\nbudget:: ${budget}`}
script_review:: ${review}
output_formats:: [1920x1920]

${scenes}`;

function workspace(doc = episodeDoc(), { series = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nn-produce-'));
  fs.writeFileSync(path.join(root, 'domaiNN_NN.md'), '---\nname: "Probe"\nworkspace_id: "probe"\n---\n\n# NN DomaiNN\n', 'utf8');
  fs.mkdirSync(path.join(root, 'specs', 'bluepriNNts', 'coNNtent'), { recursive: true });
  fs.copyFileSync(
    path.join(BLUEPRINT, 'spec_NN.md'),
    path.join(root, 'specs', 'bluepriNNts', 'coNNtent', 'spec_NN.md'),
  );
  fs.copyFileSync(path.join(BLUEPRINT, 'defaults', 'video-defaults_NN.md'), path.join(root, 'video-defaults_NN.md'));
  fs.mkdirSync(path.join(root, 'changes'), { recursive: true });
  const seriesDir = path.join(root, 'series', 's');
  const episode = path.join(seriesDir, 'episodes', 'e');
  fs.mkdirSync(episode, { recursive: true });
  if (series) {
    fs.writeFileSync(
      path.join(seriesDir, 's_series_NN.md'),
      '---\nlevel: 3\nscope: true\nparent_spec:\n  name: "coNNtent_V_0-15-0"\n  url: "https://example.invalid/coNNtent/spec_NN.md"\ntitle: "S"\n---\n\n# NN Series\n\n## NN Series: S\nslug:: s\nlanguage:: es\n',
      'utf8',
    );
  }
  const scriptPath = path.join(episode, 'e_coNNtent_s_NN.md');
  fs.writeFileSync(scriptPath, doc, 'utf8');
  return { root, episode, scriptPath };
}

const done = (dir) => fs.rmSync(dir, { recursive: true, force: true });

/** A render seam: writes the master and reports cost/timing without touching a provider. */
function fakeRender() {
  const calls = [];
  const render = async (opts) => {
    calls.push(opts);
    const dir = path.dirname(opts.scriptPath);
    const master = path.join(dir, 'probe_1920x1920.mp4');
    fs.writeFileSync(master, 'master-bytes');
    const hyperframesDir = path.join(dir, 'hyperframes');
    fs.mkdirSync(hyperframesDir, { recursive: true });
    fs.writeFileSync(
      path.join(hyperframesDir, 'manifest.json'),
      JSON.stringify({
        fps: 30,
        tracks: {
          scenes: [
            { fromFrame: 0, props: { title: 'Opening' } },
            { fromFrame: 90, props: { title: 'Explaining' } },
          ],
        },
        metadata: { scriptSource: opts.scriptPath },
      }),
    );
    return { outputVideoPath: master, renderTimeMs: 1, linkMode: 'link', spentUsd: 0.25 };
  };
  return { render, calls };
}

const assertStop = async (promise, code, exitCode) => {
  await assert.rejects(promise, (err) => {
    assert.ok(err instanceof ProduceStop, `expected ProduceStop, got ${err?.name}: ${err?.message}`);
    assert.equal(err.code, code);
    assert.equal(err.exitCode, exitCode);
    return true;
  });
};

test('review required and no approval stops with exit 10 and spends nothing', async () => {
  const ws = workspace(episodeDoc({ status: 'draft', review: 'required' }));
  const { render, calls } = fakeRender();
  try {
    await assertStop(produce({ episodePath: ws.scriptPath, deps: { render, log: () => {} } }), 'review-required', EXIT_REVIEW);
    assert.equal(calls.length, 0, 'no render ran');
    assert.equal(readEpisode(ws.scriptPath).status, 'draft', 'the state did not move past draft');
  } finally {
    done(ws.root);
  }
});

test('a needs-change scene is listed with its comment', async () => {
  const scenes = SCENE.replace('kind:: Libre', 'kind:: Libre\nreview:: needs-change');
  const ws = workspace(episodeDoc({ status: 'draft', review: 'required', scenes }));
  try {
    await assert.rejects(
      produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } }),
      (err) => {
        assert.equal(err.code, 'review-required');
        assert.match(err.message, /one: needs-change/);
        return true;
      },
    );
  } finally {
    done(ws.root);
  }
});

test('an unset budget always asks: exit 11 naming the estimate and the hash', async () => {
  const ws = workspace(episodeDoc({ status: 'draft', budget: null }));
  try {
    await assert.rejects(
      produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } }),
      (err) => {
        assert.equal(err.exitCode, EXIT_BUDGET);
        assert.equal(err.code, 'budget-unset');
        assert.match(err.message, /plan [0-9a-f]{8}/);
        return true;
      },
    );
  } finally {
    done(ws.root);
  }
});

test('an over-budget estimate stops with exit 11; the matching --approve proceeds', async () => {
  const ws = workspace(episodeDoc({ status: 'draft', budget: '0.0001' }));
  const { render, calls } = fakeRender();
  try {
    let planHash;
    await assert.rejects(
      produce({ episodePath: ws.scriptPath, deps: { render, log: () => {} } }),
      (err) => {
        assert.equal(err.exitCode, EXIT_BUDGET);
        assert.equal(err.code, 'budget-exceeded');
        planHash = err.details.planHash;
        assert.match(err.message, new RegExp(planHash.slice(0, 8)));
        return true;
      },
    );
    assert.equal(calls.length, 0, 'nothing was spent at the stop');

    const result = await produce({ episodePath: ws.scriptPath, approve: planHash, deps: { render, log: () => {} } });
    assert.equal(result.code, EXIT_DONE);
    assert.equal(calls.length, 1);
    const after = readEpisode(ws.scriptPath);
    assert.equal(after.status, 'produced');
    assert.equal(after.fields.master, 'probe_1920x1920.mp4');
    assert.ok(fs.existsSync(path.join(ws.episode, 'probe_1920x1920.mp4')));
  } finally {
    done(ws.root);
  }
});

test('produce writes the description.md chapter block and never overwrites an authored body', async () => {
  const ws = workspace(episodeDoc({ status: 'draft', review: 'skip' }));
  try {
    const result = await produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } });
    assert.equal(result.code, EXIT_DONE);

    const desc = fs.readFileSync(path.join(ws.episode, 'description.md'), 'utf8');
    assert.match(desc, /^00:00 Opening$/m, 'the first scene starts at zero');
    assert.match(desc, /^00:03 Explaining$/m, 'the second scene starts at its frame time');

    // An authored body wins: a second run must not clobber it.
    fs.writeFileSync(path.join(ws.episode, 'description.md'), 'Authored prose.', 'utf8');
    await produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } });
    assert.equal(
      fs.readFileSync(path.join(ws.episode, 'description.md'), 'utf8'),
      'Authored prose.',
      'the authored description.md is never overwritten',
    );
  } finally {
    done(ws.root);
  }
});

test('approval retires the Variant elements (design A3)', async () => {
  const withVariants = `${SCENE}
# NN Variant

## NN Variant: alt opening
for:: narration

An alternative opening line.
`;
  const ws = workspace(episodeDoc({ status: 'draft', review: 'required', scenes: withVariants }));
  try {
    const before = fs.readFileSync(ws.scriptPath, 'utf8');
    // The scene is approved in the document, so the review gate passes on the first run.
    fs.writeFileSync(
      ws.scriptPath,
      before.replace('kind:: Libre', 'kind:: Libre\nreview:: approved'),
      'utf8',
    );

    const result = await produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } });
    assert.equal(result.code, EXIT_DONE);

    const after = fs.readFileSync(ws.scriptPath, 'utf8');
    assert.doesNotMatch(after, /alt opening/, 'the consumed Variant element is removed');
    assert.match(after, /review:: approved/, 'the scene keeps its verdict');
  } finally {
    done(ws.root);
  }
});

test('a stale --approve hash stops again', async () => {
  const ws = workspace(episodeDoc({ status: 'draft', budget: '0.0001' }));
  try {
    await assertStop(
      produce({ episodePath: ws.scriptPath, approve: 'deadbeef', deps: { render: fakeRender().render, log: () => {} } }),
      'budget-exceeded',
      EXIT_BUDGET,
    );
  } finally {
    done(ws.root);
  }
});

test('an idea episode with no proposal fails naming that no script was proposed', async () => {
  const ws = workspace(episodeDoc({ status: 'idea' }));
  try {
    await assertStop(
      produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } }),
      'no-proposal',
      1,
    );
  } finally {
    done(ws.root);
  }
});

test('a proposal with an unknown key is refused and the document is unchanged', async () => {
  const ws = workspace(episodeDoc({ status: 'idea', review: 'skip' }));
  const before = fs.readFileSync(ws.scriptPath, 'utf8');
  try {
    fs.writeFileSync(
      path.join(ws.episode, 'proposal_changes_NN.md'),
      `---
spec_version: "V_0-4-0"
level: 3
parent_spec:
  name: "changes"
  url: "https://example.invalid/changes/spec_NN.md"
blueprint_version: "V_0-5-5"
status: proposed
title: "proposal"
author: "agent"
---

# NN Change

## NN Change: c-01
op:: update_field
target:: e_coNNtent_s@probe&bogus_key
to:: "nope"
evidence:: series/s/episodes/e/e_coNNtent_s_NN.md@## NN Scene: One
`,
      'utf8',
    );
    await assertStop(
      produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } }),
      'unknown-key',
      1,
    );
    assert.equal(fs.readFileSync(ws.scriptPath, 'utf8'), before, 'nothing was applied');
  } finally {
    done(ws.root);
  }
});

test('a valid proposal is applied and intake sets status:: draft', async () => {
  const ws = workspace(episodeDoc({ status: 'idea', review: 'skip', budget: '1.5' }));
  try {
    fs.writeFileSync(
      path.join(ws.episode, 'proposal_changes_NN.md'),
      `---
spec_version: "V_0-4-0"
level: 3
parent_spec:
  name: "changes"
  url: "https://example.invalid/changes/spec_NN.md"
blueprint_version: "V_0-5-5"
status: proposed
title: "proposal"
author: "agent"
---

# NN Change

## NN Change: c-01
op:: update_field
target:: e_coNNtent_s@one&kind
to:: "Libre"
evidence:: series/s/episodes/e/e_coNNtent_s_NN.md@## NN Scene: One
`,
      'utf8',
    );
    const result = await produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } });
    assert.equal(result.code, EXIT_DONE);
    assert.equal(readEpisode(ws.scriptPath).status, 'produced', 'intake -> draft -> approved -> produced');
  } finally {
    done(ws.root);
  }
});

test('an archived episode is refused naming the state', async () => {
  const ws = workspace(episodeDoc({ status: 'archived' }));
  try {
    await assertStop(
      produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } }),
      'refused-state',
      1,
    );
  } finally {
    done(ws.root);
  }
});

test('an episode pinned to another blueprint version is refused naming both', async () => {
  const ws = workspace(episodeDoc({ pin: 'V_0-14-1' }));
  try {
    await assert.rejects(
      produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } }),
      (err) => {
        assert.equal(err.code, 'blueprint-version-mismatch');
        assert.match(err.message, /V_0-14-1/);
        assert.match(err.message, /V_0-15-0/);
        return true;
      },
    );
  } finally {
    done(ws.root);
  }
});

test('an unset language is a validation error before the estimate', async () => {
  const ws = workspace(episodeDoc(), { series: false });
  try {
    await assertStop(
      produce({ episodePath: ws.scriptPath, deps: { render: fakeRender().render, log: () => {} } }),
      'missing-language',
      1,
    );
  } finally {
    done(ws.root);
  }
});

test('the engine CLI refuses the retired model flags', () => {
  const cli = path.join(SKILL, 'scripts', 'produce.mjs');
  const run = spawnSync(process.execPath, [cli, 'x', '--avatar-model', 'm'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Unknown option --avatar-model/);
  assert.doesNotMatch(run.stderr.split('\n').slice(1).join('\n'), /--avatar-model/, 'the usage never lists it');
});

test('a second run on a produced episode is idempotent and keeps produced', async () => {
  const ws = workspace(episodeDoc({ status: 'produced', budget: '1.5' }));
  const { render, calls } = fakeRender();
  try {
    const result = await produce({ episodePath: ws.scriptPath, deps: { render, log: () => {} } });
    assert.equal(result.code, EXIT_DONE);
    assert.equal(calls.length, 1, 'the master is rendered again (cache makes it free)');
    const after = readEpisode(ws.scriptPath);
    assert.equal(after.status, 'produced');
  } finally {
    done(ws.root);
  }
});
