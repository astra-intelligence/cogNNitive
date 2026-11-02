/**
 * Graph edges from live evidence (change-provenance: consumers read the log).
 *
 * A node's source edges must come from the evidence of the LAST applied change
 * of each live unit (after the epoch cut), never from a superseded change. The
 * legacy `sources::` field path stays untouched; this pass is additive.
 */
import { describe, it, expect } from 'vitest'
import { createChangeLog } from '../src/changelog/index.js'
import type { LoggedChange } from '../src/changelog/index.js'
import { attachLiveEvidence } from '../src/recursiveParser/normalize.js'
import type { KnowledgeNode } from '../src/types/index.js'

function change(over: Partial<LoggedChange> & { id: string; op: LoggedChange['op'] }): LoggedChange {
  return {
    changeset: 'changes/dom_agent_20261010T120000Z_changes_NN.md',
    index: 0,
    status: 'applied',
    changesetStatus: 'applied',
    appliedAt: '2026-10-10T12:00:00.000Z',
    target: 'm@goal-1&owner',
    applied: true,
    ...over,
  }
}

function node(): KnowledgeNode {
  return {
    id: 'goal-1',
    name: 'Goal 1',
    parentId: null,
    childIds: [],
    type: 'Work',
    kind: 'element',
    slug: 'goal-1',
    fields: {},
    relationships: [],
    rawSections: {},
    source: { path: 'kNNowledge/m_NN.md' },
  }
}

const sourceEdges = (n: KnowledgeNode) => n.relationships.filter((r) => r.origin === 'source')

describe('attachLiveEvidence', () => {
  it('uses the last applied change and never the superseded evidence', () => {
    const log = createChangeLog([
      change({ id: 'c-01', op: 'update_field', to: 'Ana', evidence: 'sources/a.md' }),
      change({ id: 'c-02', op: 'update_field', to: 'Bea', evidence: 'sources/b.md' }),
    ])
    const n = node()
    attachLiveEvidence(n, log)

    expect(n.sources?.map((ref) => ref.filePath)).toEqual(['sources/b.md'])
    expect(sourceEdges(n)).toHaveLength(1)
    expect(sourceEdges(n)[0].targetId).toBe('sources/b.md')
  })

  it('leaves no edge for a removed element and none for an untouched one', () => {
    const removed = node()
    attachLiveEvidence(
      removed,
      createChangeLog([
        change({ id: 'c-01', op: 'update_field', to: 'Ana', evidence: 'sources/a.md' }),
        change({ id: 'c-02', op: 'remove_element', target: 'm@goal-1', evidence: 'sources/a.md' }),
      ]),
    )
    expect(removed.sources).toBeUndefined()
    expect(sourceEdges(removed)).toEqual([])

    const untouched = node()
    attachLiveEvidence(untouched, createChangeLog([change({ id: 'c-01', op: 'update_field' })]))
    expect(sourceEdges(untouched)).toEqual([])
  })

  it('collects the live evidence of every unit of the element, deduped by file', () => {
    const n = node()
    attachLiveEvidence(
      n,
      createChangeLog([
        change({ id: 'c-01', op: 'update_field', to: 'Ana', evidence: 'sources/a.md@## A' }),
        change({ id: 'c-02', op: 'update_element_text', target: 'm@goal-1&#body', to: 'Prose', evidence: 'sources/b.md' }),
        change({ id: 'c-03', op: 'update_field', target: 'm@goal-1&note', to: 'Bea', evidence: 'sources/b.md@## Other' }),
      ]),
    )
    expect(n.sources?.map((ref) => ref.filePath)).toEqual(['sources/a.md', 'sources/b.md'])
    expect(sourceEdges(n)).toHaveLength(2)
  })

  it('ignores keyword evidence and cell units of other elements', () => {
    const n = node()
    attachLiveEvidence(
      n,
      createChangeLog([
        change({ id: 'c-01', op: 'update_field', to: 'Ana', evidence: 'decision' }),
        change({ id: 'c-02', op: 'update_matrix_cell', target: 'm@impact&goal-1&goal-2', to: 'high', evidence: 'sources/c.md' }),
      ]),
    )
    expect(n.sources ?? []).toEqual([])
  })
})
