/**
 * The evidence index (change-provenance: Evidence index over applied changes).
 *
 * The index is keyed by the cited path (and anchor), so a consumer asks "who
 * cites this source?" and gets the changes, the unit each one set and the
 * stamped sha list. `live` is the last applied change per live unit after the
 * epoch cut; `all-time` is every applied change. Garbage collection and the
 * uncited-source audit read all-time; graph edges read live.
 */
import { describe, it, expect } from 'vitest'
import { buildChangeLogFromChangesets, type ChangesetLike } from '../../src/changelog/load.js'

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

const keysOf = (sites: ReadonlyMap<string, unknown>) => [...sites.keys()]

describe('evidence index', () => {
  it('omits superseded evidence from live and keeps it all-time', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({ id: 'c-01', to: 'Ana', evidence: 'sources/a.md', evidence_sha256: ['sha-a'] }),
          change({ id: 'c-02', to: 'Bea', evidence: 'sources/b.md', evidence_sha256: ['sha-b'] }),
        ],
      }),
    ])

    const live = log.evidence('live')
    expect(live.has('sources/b.md')).toBe(true)
    expect(live.has('sources/a.md')).toBe(false)
    expect(live.get('sources/b.md')).toEqual([
      { changeId: 'c-02', unit: 'm@goal-1&owner', evidence: ['sources/b.md'], sha256: ['sha-b'] },
    ])

    const allTime = log.evidence('all-time')
    expect(new Set(keysOf(allTime))).toEqual(new Set(['sources/a.md', 'sources/b.md']))
    expect(allTime.get('sources/a.md')?.[0].changeId).toBe('c-01')
  })

  it('leaves no live edge for a removed unit but keeps it all-time', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({ id: 'c-01', to: 'Ana', evidence: 'sources/a.md' }),
          change({ id: 'c-02', op: 'remove_element', target: 'm@goal-1', evidence: 'sources/a.md' }),
        ],
      }),
    ])

    expect(log.evidence('live').has('sources/a.md')).toBe(false)
    expect(log.evidence('all-time').get('sources/a.md')?.map((s) => s.changeId)).toEqual(['c-01', 'c-02'])
  })

  it('indexes every cited item of a list and carries the positional sha list', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({
            id: 'c-01',
            to: 'Ana',
            evidence: '[sources/a.md, sources/b.md]',
            evidence_sha256: ['sha-a', 'sha-b'],
          }),
        ],
      }),
    ])

    const live = log.evidence('live')
    expect(new Set(keysOf(live))).toEqual(new Set(['sources/a.md', 'sources/b.md']))
    expect(live.get('sources/a.md')).toEqual([
      {
        changeId: 'c-01',
        unit: 'm@goal-1&owner',
        evidence: ['sources/a.md', 'sources/b.md'],
        sha256: ['sha-a', 'sha-b'],
      },
    ])
  })

  it('keeps the creation evidence of a live element and drops it with the element', () => {
    const alive = buildChangeLogFromChangesets([
      changeset({
        changes: [change({ id: 'c-01', op: 'add_element', target: 'm@goal-1', name: 'Goal 1', evidence: 'sources/a.md' })],
      }),
    ])
    expect(alive.evidence('live').get('sources/a.md')?.[0].changeId).toBe('c-01')

    const removed = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({ id: 'c-01', op: 'add_element', target: 'm@goal-1', name: 'Goal 1', evidence: 'sources/a.md' }),
          change({ id: 'c-02', op: 'remove_element', target: 'm@goal-1', evidence: 'sources/a.md' }),
        ],
      }),
    ])
    expect(removed.evidence('live').has('sources/a.md')).toBe(false)
    expect(removed.evidence('all-time').get('sources/a.md')?.map((s) => s.changeId)).toEqual(['c-01', 'c-02'])
  })

  it('applies the epoch cut: a reused slug does not inherit the previous evidence', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        path: 'changes/dom_agent_20261010T120000Z_changes_NN.md',
        changes: [change({ id: 'c-01', to: 'Ana', evidence: 'sources/a.md' })],
      }),
      changeset({
        path: 'changes/dom_agent_20261010T130000Z_changes_NN.md',
        appliedAt: '2026-10-10T13:00:00.000Z',
        changes: [
          change({ id: 'c-02', op: 'remove_element', target: 'm@goal-1', evidence: 'sources/a.md' }),
          change({ id: 'c-03', op: 'add_element', target: 'm@goal-1', name: 'Goal 1', evidence: 'sources/b.md' }),
        ],
      }),
    ])

    const live = log.evidence('live')
    expect(live.has('sources/a.md')).toBe(false)
    expect(live.get('sources/b.md')?.map((s) => s.changeId)).toEqual(['c-03'])
  })

  it('ignores non-applied changes in both scopes', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({ id: 'c-01', status: 'applied', to: 'Ana', evidence: 'sources/a.md' }),
          change({ id: 'c-02', status: 'conflict', to: 'Bea', evidence: 'sources/b.md' }),
          change({ id: 'c-03', status: 'rejected', to: 'Carla', evidence: 'sources/c.md' }),
        ],
      }),
    ])

    expect(new Set(keysOf(log.evidence('all-time')))).toEqual(new Set(['sources/a.md']))
    expect(new Set(keysOf(log.evidence('live')))).toEqual(new Set(['sources/a.md']))
  })

  it('caps an artifact unit with its own evidence and no model units', () => {
    const log = buildChangeLogFromChangesets([
      changeset({
        changes: [
          change({
            id: 'c-01',
            op: 'produce_artifact',
            target: 'artifacts/summary.md',
            evidence: '[sources/a.md, sources/b.md]',
          }),
        ],
      }),
    ])

    expect(log.evidence('live').get('sources/b.md')?.[0]).toEqual({
      changeId: 'c-01',
      unit: 'artifacts/summary.md',
      evidence: ['sources/a.md', 'sources/b.md'],
      sha256: [],
    })
  })
})
