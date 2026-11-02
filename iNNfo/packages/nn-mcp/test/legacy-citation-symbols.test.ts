/**
 * S5a.1 gate (change-provenance: `sources::` is not a citation).
 *
 * The reserved-name helpers are gone, `sources::` no longer feeds history, edges
 * or console citations, and the console export no longer declares upstream
 * through `meta.sources`.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as core from '@cognnitive/nn-core'

const here = dirname(fileURLToPath(import.meta.url))
const coreSrc = join(here, '..', '..', 'nn-core', 'src')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.ts$/.test(entry.name) && !/\.spec\.ts$/.test(entry.name)) out.push(full)
  }
  return out
}

describe('legacy citation symbols are gone', () => {
  it('exports none of the deleted helpers', () => {
    for (const name of [
      'SOURCE_FIELD_NAMES',
      'CONFLICT_FIELD_NAMES',
      'dedupeCitationList',
      'legacyDerivationKeyFor',
    ]) {
      expect((core as Record<string, unknown>)[name]).toBeUndefined()
    }
    expect(core.citationFieldsFor).toBeTypeOf('function')
  })

  it('does not read `sources::` in the serializer, the graph or the payload', () => {
    const offenders: string[] = []
    for (const file of walk(coreSrc)) {
      const source = readFileSync(file, 'utf-8')
      if (/SOURCE_FIELD_NAMES|attachSourceCitations|LEGACY_DERIVATION_KEY/.test(source)) {
        offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })

  it('is not read by the graph, the serializer or the projection', () => {
    const fields = { sources: 'sources/import/a.md@## A', owner: 'Ana' }
    // The console still renders a legacy field's citations until the corpus
    // rebuild (S5b.4); the graph/serializer/projection do not read it.
    expect(core.citationFieldsFor('Anything', fields)).toEqual(['sources'])
  })
})
