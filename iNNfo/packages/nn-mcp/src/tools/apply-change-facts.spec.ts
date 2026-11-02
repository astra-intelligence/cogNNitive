import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { join } from 'node:path'
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { parseChangeset, verifyProposalSha } from '@cognnitive/nn-core'
import { proposeChangeset } from './propose-changeset'
import { applyChange } from './apply-change'
import type { ConsoleWriter } from './console-regeneration'

const root = join(import.meta.dirname!, '..', '..', 'temp-test-facts')
const knowledgeDir = join(root, 'kNNowledge')
const changesDir = join(root, 'changes')
const specsDir = join(root, 'specs')
const sourcesDir = join(root, 'sources', 'import')
const consolePath = join(root, 'domaiNN_console.html')

const BLUEPRINT = `---
spec_version: "V_0-4-0"
level: 2
blueprint_version: "V_0-2-0"
blueprint_name: "strategy"
title: "Strategy Template"
parent_spec:
  name: "iNNfo_V_0-3-0"
  url: "specs/iNNfo_V_0-3-0_NN.md"
---

# NN Concept Definition
## NN Concept Definition: Work
type:: list

# NN Field Definition
## NN Field Definition: statement
concept:: Work
type:: string
`

const LIVE_MODEL = `---
spec_version: "V_0-4-0"
level: 3
parent_spec:
  name: "strategy_V_0-2-0"
  url: "specs/strategy_V_0-2-0_NN.md"
knowledge_version: "V_0-1-0"
title: "Strategy"
---

# NN index
* [[Work]]

# NN Work
## NN Work: Vision
slug:: vision
statement:: Accelerate green energy
`

const writer: ConsoleWriter = async () => ({ path: consolePath, status: 'written', opened: false })
const propose = (operations: unknown[]) =>
  proposeChangeset(root, { operations, open: false }, { writer })

const UPDATE = {
  op: 'update_field',
  target: 'strategy@vision&statement',
  from: 'Accelerate green energy',
  to: 'Accelerate clean energy',
}

function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

async function readApplied(): Promise<ReturnType<typeof parseChangeset>> {
  const files = await (await import('node:fs/promises')).readdir(changesDir)
  expect(files).toHaveLength(1)
  return parseChangeset(await readFile(join(changesDir, files[0]), 'utf-8'))
}

beforeEach(async () => {
  process.env.INNFO_CACHE_DIR = join(root, '.cache')
  vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network disabled in tests'))
  await rm(root, { recursive: true, force: true })
  for (const dir of [knowledgeDir, specsDir, sourcesDir, changesDir]) await mkdir(dir, { recursive: true })
  await writeFile(
    join(specsDir, 'iNNfo_V_0-3-0_NN.md'),
    '---\nspec_version: "V_0-3-0"\nlevel: 1\ntitle: "iNNfo"\nparent_spec:\n  name: "defiNNition_V_0-1-0"\n  url: "specs/defiNNition_V_0-1-0_NN.md"\n---\n',
    'utf-8',
  )
  await writeFile(
    join(specsDir, 'defiNNition_V_0-1-0_NN.md'),
    '---\nspec_version: "V_0-1-0"\nlevel: 0\ntitle: "defiNNition"\n---\n',
    'utf-8',
  )
  await writeFile(join(specsDir, 'strategy_V_0-2-0_NN.md'), BLUEPRINT, 'utf-8')
  await writeFile(join(knowledgeDir, 'strategy_NN.md'), LIVE_MODEL, 'utf-8')
  await writeFile(join(sourcesDir, 'a.md'), '# One\nA body\n', 'utf-8')
  await writeFile(join(sourcesDir, 'b.md'), '# Two\nB body\n', 'utf-8')
})

afterEach(async () => {
  delete process.env.INNFO_CACHE_DIR
  vi.restoreAllMocks()
  await rm(root, { recursive: true, force: true })
})

describe('execution facts at apply', () => {
  it('stamps resolved_target on applied changes only', async () => {
    const proposed = await propose([
      { ...UPDATE, evidence: 'sources/import/a.md' },
      { ...UPDATE, to: 'other', evidence: 'sources/import/a.md' },
    ])
    expect(proposed.success).toBe(true)
    const applied = await applyChange(root, proposed.changeset!)
    expect(applied.success).toBe(true)

    const doc = await readApplied()
    const appliedChange = doc.changes.find((c) => c.id === 'c-01')!
    expect(appliedChange.resolved_target).toBe('strategy@vision&statement')
  })

  it('stamps one evidence sha per entry, in order, and none for unknown', async () => {
    const proposed = await propose([
      { ...UPDATE, evidence: '[sources/import/a.md, sources/import/b.md]' },
    ])
    await applyChange(root, proposed.changeset!)
    const doc = await readApplied()
    expect(doc.changes[0].evidence_sha256).toEqual([
      sha('# One\nA body\n'),
      sha('# Two\nB body\n'),
    ])
  })

  it('leaves decision and unknown evidence without a sha', async () => {
    const proposed = await propose([
      { ...UPDATE, to: 'by decision', evidence: 'decision' },
      { ...UPDATE, to: 'by unknown', evidence: 'unknown' },
    ])
    await applyChange(root, proposed.changeset!)
    const doc = await readApplied()
    expect(doc.changes.map((c) => c.evidence_sha256)).toEqual([undefined, undefined])
  })

  it('keeps the seal valid after the facts are written back', async () => {
    const proposed = await propose([{ ...UPDATE, evidence: 'sources/import/a.md' }])
    await applyChange(root, proposed.changeset!)
    const doc = await readApplied()
    expect(doc.changes[0].resolved_target).toBe('strategy@vision&statement')
    expect(verifyProposalSha(doc)).toBe(true)
  })

  it('overwrites a resolved_target a proposal pre-carried', async () => {
    const proposed = await propose([
      { ...UPDATE, evidence: 'sources/import/a.md', resolved_target: 'other@x&y' },
    ])
    await applyChange(root, proposed.changeset!)
    const doc = await readApplied()
    expect(doc.changes[0].resolved_target).toBe('strategy@vision&statement')
  })

  it('shares applied_at across the batch and clamps it past the latest applied change', async () => {
    const future = '2099-01-01T00:00:00.000Z'
    await writeFile(
      join(changesDir, 'seed_agent_20261010T120000Z_changes_NN.md'),
      [
        '---',
        'spec_version: "V_0-4-0"',
        'level: 3',
        'parent_spec:',
        '  name: changes',
        '  url: "https://example.test/changes/spec_NN.md"',
        'blueprint_version: "V_0-6-0"',
        'status: applied',
        `applied_at: "${future}"`,
        '---',
        '',
        '# NN Change',
        '',
        '## NN Change: c-01',
        'op:: update_field',
        'target:: strategy@vision&statement',
        'to:: seeded',
        'evidence:: decision',
        `status:: applied`,
        `applied_at:: ${future}`,
      ].join('\n'),
      'utf-8',
    )

    const second = await propose([
      { ...UPDATE, to: 'second', evidence: 'sources/import/a.md' },
      { ...UPDATE, to: 'third', evidence: 'sources/import/a.md' },
    ])
    await applyChange(root, second.changeset!)
    const doc = parseChangeset(await readFile(join(root, second.changeset!), 'utf-8'))
    const times = doc.changes.map((c) => c.applied_at)
    expect(new Set(times).size).toBe(1)
    expect(times[0]! > future).toBe(true)
  })
})
