import { describe, it, expect } from 'vitest'
import {
  buildChangeLog,
  buildChangeLogFromChangesets,
  isChangesetPath,
  type ChangesetLike,
} from '../../src/changelog/load.js'

function changeset(overrides: Partial<ChangesetLike> = {}): ChangesetLike {
  return {
    path: 'changes/dom_agent_20261010T120000Z_changes_NN.md',
    status: 'applied',
    author: 'lucas',
    appliedAt: '2026-10-10T12:00:00.000Z',
    changes: [],
    ...overrides,
  }
}

const change = (over: Record<string, unknown> = {}) => ({
  id: 'c-01',
  op: 'update_field',
  target: 'm@goal-1&owner',
  ...over,
})

describe('isChangesetPath', () => {
  it('accepts *_changes_NN.md documents and rejects everything else', () => {
    expect(isChangesetPath('changes/dom_agent_20261010T120000Z_changes_NN.md')).toBe(true)
    expect(isChangesetPath('changes/notes.md')).toBe(false)
    expect(isChangesetPath('changes/notes.txt')).toBe(false)
    expect(isChangesetPath('kNNowledge/model_NN.md')).toBe(false)
    expect(isChangesetPath('changes/model_sidecar_NN.md')).toBe(false)
  })
})

describe('ChangeLog', () => {
  it('lists every status in canonical order for the review UI', () => {
    const log = buildChangeLogFromChangesets([
      changeset({ path: 'changes/b_agent_20261010T130000Z_changes_NN.md', changes: [change({ id: 'c-b' })] }),
      changeset({ path: 'changes/a_agent_20261010T120000Z_changes_NN.md', changes: [change({ id: 'c-a' })] }),
    ])
    expect(log.all.map((c) => c.id)).toEqual(['c-a', 'c-b'])
  })

  it('derives history and origin from applied changes only', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({ id: 'c-01', status: 'applied', to: 'Ana', evidence: 'sources/a.md' }),
          change({ id: 'c-02', status: 'conflict', to: 'Bea', evidence: 'sources/b.md' }),
          change({ id: 'c-03', status: 'applied', to: 'Carla', evidence: 'sources/c.md' }),
        ],
      }),
    ])
    expect(log.history('m@goal-1&owner').map((c) => c.id)).toEqual(['c-01', 'c-03'])
    expect(log.origin('m@goal-1&owner')?.evidence).toBe('sources/c.md')
  })

  it('keeps an applied sibling of a partially applied changeset and drops the conflicted one', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        status: 'partially_applied',
        changes: [
          change({ id: 'c-01', status: 'applied', target: 'm@goal-1&owner' }),
          change({ id: 'c-02', status: 'conflict', target: 'm@goal-1&owner' }),
        ],
      }),
    ])
    expect(log.history('m@goal-1&owner').map((c) => c.id)).toEqual(['c-01'])
  })

  it('contributes nothing from a rejected changeset', () => {
    const log = buildChangeLogFromChangesets([
      changeset({ status: 'rejected', changes: [change({ id: 'c-01' })] }),
    ])
    expect(log.all).toHaveLength(1)
    expect(log.history('m@goal-1&owner')).toEqual([])
    expect(log.origin('m@goal-1&owner')).toBeUndefined()
  })

  it('is model-scoped: the same slug in two models does not collide', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({ id: 'c-01', target: 'm1@goal-1&owner', to: 'Ana' }),
          change({ id: 'c-02', target: 'm2@goal-1&owner', to: 'Bea' }),
        ],
      }),
    ])
    expect(log.history('m1@goal-1&owner').map((c) => c.id)).toEqual(['c-01'])
    expect(log.history('m2@goal-1&owner').map((c) => c.id)).toEqual(['c-02'])
    expect(log.origin('m1@goal-1&owner')?.to).toBe('Ana')
  })

  it('prefers the stamped resolved_target over the authored target', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [change({ id: 'c-01', target: 'm@Alpha&owner', resolved_target: 'm@alpha&owner' })],
      }),
    ])
    expect(log.history('m@alpha&owner').map((c) => c.id)).toEqual(['c-01'])
    expect(log.history('m@Alpha&owner')).toEqual([])
  })

  it('does not match a target by a punctuation-stripping key', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({ id: 'c-01', target: 'm@a-b&owner' }),
          change({ id: 'c-02', target: 'm@ab&owner' }),
        ],
      }),
    ])
    expect(log.history('m@a-b&owner').map((c) => c.id)).toEqual(['c-01'])
    expect(log.history('m@ab&owner').map((c) => c.id)).toEqual(['c-02'])
  })

  it('orders history with the shared comparator across changesets', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        path: 'changes/b_agent_20261010T130000Z_changes_NN.md',
        appliedAt: '2026-10-10T12:00:00.000Z',
        changes: [change({ id: 'later-stamp' })],
      }),
      changeset({
        path: 'changes/z_human_20261010T120000Z_changes_NN.md',
        appliedAt: '2026-10-10T12:00:00.000Z',
        changes: [change({ id: 'earlier-stamp' })],
      }),
    ])
    expect(log.history('m@goal-1&owner').map((c) => c.id)).toEqual(['earlier-stamp', 'later-stamp'])
  })

  it('builds from a filesystem snapshot', () => {
    const log = buildChangeLog([
      {
        path: 'changes/dom_agent_20261010T120000Z_changes_NN.md',
        content: `---
spec_version: "V_0-5-0"
level: 3
parent_spec:
  name: changes
  url: "https://example.test/changes/spec_NN.md"
blueprint_version: "0.1.0"
status: applied
author: "lucas"
applied_at: "2026-10-10T12:00:00.000Z"
---

# NN Change

## NN Change: c-01
op:: update_field
target:: m@goal-1&owner
to:: Ana
evidence:: sources/a.md
`,
      },
    ])
    expect(log.origin('m@goal-1&owner')?.evidence).toBe('sources/a.md')
  })
})
