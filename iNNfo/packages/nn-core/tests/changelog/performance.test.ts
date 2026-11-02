/**
 * Performance and browser-safety guards for the change log (change-provenance:
 * the fold is O(C+U) and the module is browser-safe).
 *
 * Budget (documented, not a micro-benchmark): a workspace-scale corpus of
 * 12,000 applied changes over 600 elements (20 units each) must build the log,
 * fold it, enumerate its units and build both evidence scopes in under
 * PERFORMANCE_BUDGET_MS on CI-class hardware. The corpus is ~20x the largest
 * real domain in the repository, so the guard catches accidental quadratic
 * behaviour (a per-change model load, a per-unit re-scan of the log) rather
 * than measuring milliseconds.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildChangeLogFromChangesets, type ChangesetLike } from '../../src/changelog/load.js'

const PERFORMANCE_BUDGET_MS = 4_000
const ELEMENTS = 600
const FIELDS_PER_ELEMENT = 20
const CHANGESET_SIZE = 100

/** ~12,000 applied changes over 600 elements: 20 `update_field` ops each. */
function largeCorpus(): ChangesetLike[] {
  const changesets: ChangesetLike[] = []
  let batch = 0
  let changes: Array<Record<string, unknown>> = []
  for (let element = 0; element < ELEMENTS; element++) {
    for (let field = 0; field < FIELDS_PER_ELEMENT; field++) {
      changes.push({
        id: `c-${element}-${field}`,
        op: 'update_field',
        target: `m@element-${element}&field-${field}`,
        to: `value-${field}`,
        evidence: `sources/source-${element % 50}.md@## Section ${field}`,
      })
      if (changes.length === CHANGESET_SIZE) {
        changesets.push({
          path: `changes/dom_agent_20261010T120000Z_changes_${String(batch).padStart(2, '0')}.md`,
          status: 'applied',
          author: 'bench',
          appliedAt: '2026-10-10T12:00:00.000Z',
          changes: changes as ChangesetLike['changes'],
        })
        changes = []
        batch++
      }
    }
  }
  return changesets
}

describe('changelog performance guard', () => {
  it(`folds a 12,000-change corpus and builds both evidence scopes under ${PERFORMANCE_BUDGET_MS}ms`, () => {
    const changesets = largeCorpus()
    const started = performance.now()
    const log = buildChangeLogFromChangesets(changesets)
    const units = [...log.units()]
    const live = log.evidence('live')
    const allTime = log.evidence('all-time')
    const elapsed = performance.now() - started

    expect(log.all).toHaveLength(ELEMENTS * FIELDS_PER_ELEMENT)
    expect(units).toHaveLength(ELEMENTS * FIELDS_PER_ELEMENT)
    // 50 cited files x 20 anchors: the index is keyed by citation, not by unit.
    expect(live.size).toBe(50 * FIELDS_PER_ELEMENT)
    expect(allTime.size).toBe(50 * FIELDS_PER_ELEMENT)
    expect(elapsed).toBeLessThan(PERFORMANCE_BUDGET_MS)
  })
})

const changelogDir = join(dirname(fileURLToPath(import.meta.url)), '../../src/changelog')

describe('changelog browser safety', () => {
  it('imports Node built-ins only from node.ts', () => {
    const offenders: string[] = []
    for (const name of readdirSync(changelogDir)) {
      if (!name.endsWith('.ts') || name === 'node.ts') continue
      const source = readFileSync(join(changelogDir, name), 'utf-8')
      if (/from\s+'node:|require\(\s*'node:/.test(source)) offenders.push(name)
    }
    expect(offenders).toEqual([])
  })
})
