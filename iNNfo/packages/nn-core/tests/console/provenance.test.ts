import { describe, it, expect } from 'vitest'
import { deriveValueHistory, deriveFieldOrigin, detectUnrecordedEdits } from '../../src/console/provenance.js'
import { buildChangeLogFromChangesets, type ChangesetLike } from '../../src/changelog/load.js'

function changeset(changes: Array<Record<string, unknown>>, appliedAt?: string, path?: string): ChangesetLike {
  return {
    path: path ?? 'changes/ws_agent_20261010T120000Z_changes_NN.md',
    status: 'applied',
    appliedAt,
    changes: changes.map((c, i) => ({
      id: (c.id as string) ?? `c-${i + 1}`,
      op: (c.op as string) ?? 'update_field',
      target: c.target as string,
      ...c,
    })),
  }
}

describe('deriveValueHistory', () => {
  it('returns the applied hops in comparator order', () => {
    const log = buildChangeLogFromChangesets([
      changeset([{ id: 'c2', target: 'pricing@sku-42&precio', from: '8', to: '9', applied_at: '2026-02-01T00:00:00.000Z' }]),
      changeset([{ id: 'c1', target: 'pricing@sku-42&precio', from: '7', to: '8', applied_at: '2026-01-01T00:00:00.000Z' }]),
      changeset([{ id: 'c4', target: 'pricing@sku-42&precio', from: '9', to: '10', applied_at: '2026-03-01T00:00:00.000Z' }]),
    ])
    const hops = deriveValueHistory(log, 'pricing@sku-42&precio')
    expect(hops.map((h) => h.to)).toEqual(['8', '9', '10'])
    expect(hops.map((h) => h.changeId)).toEqual(['c1', 'c2', 'c4'])
  })

  it('excludes a change that is not applied', () => {
    const log = buildChangeLogFromChangesets([
      changeset([
        { id: 'c1', target: 'pricing@sku-42&precio', to: '8' },
        { id: 'c2', target: 'pricing@sku-42&precio', to: '9', status: 'conflict' },
      ]),
    ])
    expect(deriveValueHistory(log, 'pricing@sku-42&precio').map((h) => h.changeId)).toEqual(['c1'])
  })

  it('returns nothing for a unit with no applied change', () => {
    const log = buildChangeLogFromChangesets([changeset([{ target: 'pricing@matrix:&row&col' }])])
    expect(deriveValueHistory(log, 'pricing@sku-42&precio')).toEqual([])
  })
})

describe('deriveFieldOrigin', () => {
  it('returns the last applied change with its author and evidence', () => {
    const log = buildChangeLogFromChangesets([
      changeset(
        [{ id: 'c1', target: 'pricing@sku-42&precio', to: '8', author: 'ana', evidence: 'sources/a.md@## X' }],
        '2026-01-01T00:00:00.000Z',
      ),
      changeset(
        [{ id: 'c2', target: 'pricing@sku-42&precio', to: '9', author: 'juan', evidence: 'decision' }],
        '2026-02-01T00:00:00.000Z',
      ),
    ])
    const origin = deriveFieldOrigin(log, 'pricing@sku-42&precio')
    expect(origin?.changeId).toBe('c2')
    expect(origin?.author).toBe('juan')
    expect(origin?.evidence).toBe('decision')
    expect(origin?.to).toBe('9')
  })

  it('is null when no applied change targets the unit', () => {
    expect(deriveFieldOrigin(buildChangeLogFromChangesets([]), 'pricing@sku-42&precio')).toBeNull()
  })

  it('is model-scoped', () => {
    const log = buildChangeLogFromChangesets([
      changeset([
        { id: 'c1', target: 'm1@goal-1&owner', to: 'Ana' },
        { id: 'c2', target: 'm2@goal-1&owner', to: 'Bea' },
      ]),
    ])
    expect(deriveFieldOrigin(log, 'm1@goal-1&owner')?.to).toBe('Ana')
    expect(deriveFieldOrigin(log, 'm2@goal-1&owner')?.to).toBe('Bea')
  })
})

describe('detectUnrecordedEdits', () => {
  const log = buildChangeLogFromChangesets([
    changeset([{ id: 'c1', target: 'pricing@sku-42&precio', to: '10' }]),
  ])

  it('flags a field whose value diverges from the last change', () => {
    const diags = detectUnrecordedEdits([{ id: 'sku-42', modelId: 'pricing', fields: { precio: '12' } }], log)
    expect(diags.map((d) => d.code)).toEqual(['EDITED_WITHOUT_RECORD'])
  })

  it('is silent when the value equals the last change', () => {
    const elements = [{ id: 'sku-42', modelId: 'pricing', fields: { precio: '10' } }]
    expect(detectUnrecordedEdits(elements, log)).toEqual([])
  })

  it('is silent for a field with no targeting change', () => {
    const elements = [{ id: 'sku-42', modelId: 'pricing', fields: { name: 'X' } }]
    expect(detectUnrecordedEdits(elements, log)).toEqual([])
  })

  it('reads a qualified element id by its element part', () => {
    const elements = [
      { id: 'other@sku-42', slug: 'sku-42', fields: { precio: '12' } },
      { id: 'pricing@other', slug: 'other', fields: { precio: '12' } },
    ]
    const diags = detectUnrecordedEdits(elements, log)
    expect(diags.map((d) => d.path)).toEqual(['sku-42&precio'])
  })
})
