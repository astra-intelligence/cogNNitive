import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

/**
 * S5b.1 spec integrity (change-provenance A14): the new L1 and the bluepriNNts it
 * pins.
 *
 * - `iNNfo_V_0-6-0` exists, defines `citation` ONLY as change `evidence`, and
 *   reserves `sources::` as banned.
 * - `iNNfo_V_0-5-0` stays byte-identical (write-once: still referenced).
 * - Only `changes`, `sidecar` and `visual-catalog` pin V_0-6-0.
 * - `visual-catalog`'s `source` fields are not `citation`.
 */

const ROOT = path.resolve(import.meta.dirname, '..')
const SPECS = path.join(ROOT, 'iNNfo', 'specs')
const L1 = (version) => path.join(SPECS, `iNNfo_V_${version}_NN.md`)
const BLUEPRINT = (name) => path.join(SPECS, 'bluepriNNts', name, 'spec_NN.md')

const read = (p) => fs.readFileSync(p, 'utf8')

test('iNNfo_V_0-6-0 exists and bans sources::', () => {
  const p = L1('0-6-0')
  assert.equal(fs.existsSync(p), true, 'the new L1 is published')
  const content = read(p)
  assert.match(content, /spec_version:\s*"V_0-6-0"/)
  assert.match(content, /sources::/, 'the reserved property is still documented')
  assert.match(content, /ban|MUST NOT|reserved/i, 'it says the reserved property is banned on L3')
})

test('citation is defined only as change evidence', () => {
  const content = read(L1('0-6-0'))
  // Every occurrence of a citation Field definition mentions changes/evidence.
  const citationLines = content
    .split('\n')
    .filter((line) => /type:: citation/.test(line))
  assert.ok(citationLines.length > 0, 'the citation type is still defined somewhere')
  for (const line of citationLines) {
    assert.match(line, /changes|evidence|banned/i, `citation must be scoped to changes.evidence: ${line}`)
  }
})

test('iNNfo_V_0-5-0 stays byte-identical (write-once)', () => {
  const rel = 'iNNfo/specs/iNNfo_V_0-5-0_NN.md'
  let changed = ''
  try {
    changed = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', rel], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim()
  } catch {
    return // no git in the sandbox: nothing to compare against
  }
  assert.equal(changed, '', 'the published V_0-5-0 is never edited')
  assert.match(read(path.join(ROOT, rel)), /spec_version:\s*"V_0-5-0"/)
})

test('only changes, sidecar and visual-catalog pin V_0-6-0', () => {
  const expected = ['changes', 'sidecar', 'visual-catalog']
  const dir = path.join(SPECS, 'bluepriNNts')
  const pinned = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      const p = BLUEPRINT(name)
      if (!fs.existsSync(p)) return false
      return /iNNfo_V_0-6-0/i.test(read(p))
    })
    .sort()
  assert.deepEqual(pinned, [...expected].sort())
})

test('visual-catalog source fields are not citation', () => {
  const content = read(BLUEPRINT('visual-catalog'))
  const sourceBlocks = content.split('## NN Field Definition:')
  for (const block of sourceBlocks) {
    if (!/^\s*source\b/m.test(block)) continue
    assert.doesNotMatch(block, /type:: citation/, 'a `source` field must not be a citation')
  }
})

test('the workspace spec declares no Executions concept', () => {
  const workspaceSpecs = fs
    .readdirSync(SPECS)
    .filter((name) => /^workspace_V_\d+-\d+-\d+_NN\.md$/.test(name))
    .sort()
  assert.ok(workspaceSpecs.length > 0, 'a published workspace spec exists')
  const newest = workspaceSpecs[workspaceSpecs.length - 1]
  const content = read(path.join(SPECS, newest))
  assert.doesNotMatch(content, /NN Concept Definition: Executions/)
  assert.doesNotMatch(content, /\[\[Executions\]\]/)
})

test('the simulacro fixture uses a workspace spec without Executions', () => {
  const fixture = path.join(
    ROOT,
    'iNNfo/packages/nn-core/tests/fixtures/simulacro-refactorizacion/bluepriNNts/workspace_spec_NN.md',
  )
  assert.equal(fs.existsSync(fixture), true)
  const content = read(fixture)
  assert.doesNotMatch(content, /NN Concept Definition: Executions/)
  assert.doesNotMatch(content, /\[\[Executions\]\]/)
})
