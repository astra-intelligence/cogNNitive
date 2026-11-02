/**
 * `resolve_sources` with a `target` address (change-provenance: consumers read
 * the log).
 *
 * Without a target the tool keeps resolving an element's citation-typed fields.
 * With a target (`model@element&field`, `model@element&#body`,
 * `model@matrix&row&col`) it returns the evidence items of the ORIGIN change of
 * that unit — the last applied change, never a superseded one — each carrying
 * its `changeId`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'node:path'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { computeProposalSha, serializeChangeset } from '@cognnitive/nn-core'
import type { ChangeItem } from '@cognnitive/nn-core'
import { resolveSources } from '../src/tools/resolve-sources.js'

const root = join(import.meta.dirname!, '..', 'temp-test-resolve-sources-target')
const knowledgeDir = join(root, 'kNNowledge')
const changesDir = join(root, 'changes')
const sourcesDir = join(root, 'sources', 'import')

const MODEL = `---
title: "Goal Model"
knowledge_version: "V_0-1-0"
parent_spec:
  name: "TestLab_V_0-1-0"
  url: "specs/TestLab_NN.md"
---

# NN Concept 1
## NN Concept 1: Goal 1
slug:: goal-1
owner:: Bea

# NN matrices: Impact Matrix
| - | Goal 1 |
| :--- | :---: |
| Goal 1 | high |
`

async function writeChanges(changes: ChangeItem[]): Promise<void> {
  const withEvidence = changes.map((c) => ({ ...c, evidence: c.evidence ?? 'decision' }))
  const doc = {
    frontmatter: {
      spec_version: 'V_0-4-0',
      level: 3 as const,
      parent_spec: { name: 'changes' as const, url: 'https://example.test/changes/spec_NN.md' },
      blueprint_version: 'V_0-6-0',
      status: 'applied' as const,
      applied_at: '2026-10-10T12:00:00.000Z',
      proposal_sha: computeProposalSha(withEvidence),
    },
    changes: withEvidence,
  }
  await writeFile(
    join(changesDir, 'dom_agent_20261010T120000Z_changes_NN.md'),
    serializeChangeset(doc),
    'utf-8',
  )
}

beforeEach(async () => {
  await rm(root, { recursive: true, force: true })
  for (const dir of [knowledgeDir, changesDir, sourcesDir]) await mkdir(dir, { recursive: true })
  await writeFile(join(knowledgeDir, 'goal_NN.md'), MODEL, 'utf-8')
  await writeFile(join(sourcesDir, 'a.md'), '# A\n\nOwned.\n', 'utf-8')
  await writeFile(join(sourcesDir, 'b.md'), '# B\n\nRevised.\n', 'utf-8')
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('resolve_sources target', () => {
  it('returns the origin change evidence of a field unit', async () => {
    await writeChanges([
      { id: 'c-01', op: 'update_field', target: 'goal@goal-1&owner', to: 'Ana', evidence: 'sources/import/a.md' },
      { id: 'c-02', op: 'update_field', target: 'goal@goal-1&owner', to: 'Bea', evidence: 'sources/import/b.md' },
    ])

    const citations = await resolveSources(root, {
      model: 'goal',
      elementId: 'goal-1',
      target: 'goal@goal-1&owner',
    })
    expect(citations).toHaveLength(1)
    expect(citations[0].path).toBe('sources/import/b.md')
    expect(citations[0].changeId).toBe('c-02')
    expect(citations[0].field).toBe('owner')
  })

  it('resolves a body unit and a matrix cell unit', async () => {
    await writeChanges([
      { id: 'c-01', op: 'update_element_text', target: 'goal@goal-1', resolved_target: 'goal@goal-1&#body', to: 'Prose', evidence: 'sources/import/a.md' },
      { id: 'c-02', op: 'update_matrix_cell', target: 'goal@Impact Matrix&goal-1&goal-1', resolved_target: 'goal@impact-matrix&goal-1&goal-1', to: 'high', evidence: 'sources/import/b.md' },
    ])

    const body = await resolveSources(root, { model: 'goal', elementId: 'goal-1', target: 'goal@goal-1&#body' })
    expect(body.map((c) => [c.path, c.changeId, c.field])).toEqual([['sources/import/a.md', 'c-01', '#body']])

    const matrix = await resolveSources(root, {
      model: 'goal',
      elementId: 'goal-1',
      target: 'goal@impact-matrix&goal-1&goal-1',
    })
    expect(matrix.map((c) => [c.path, c.changeId])).toEqual([['sources/import/b.md', 'c-02']])
  })

  it('returns nothing for a unit with no applied change and skips keyword evidence', async () => {
    await writeChanges([{ id: 'c-01', op: 'update_field', target: 'goal@goal-1&owner', to: 'Bea', evidence: 'decision' }])

    const keyword = await resolveSources(root, { model: 'goal', elementId: 'goal-1', target: 'goal@goal-1&owner' })
    expect(keyword).toEqual([])

    const unknownTarget = await resolveSources(root, { model: 'goal', elementId: 'goal-1', target: 'goal@ghost&owner' })
    expect(unknownTarget).toEqual([])
  })
})
