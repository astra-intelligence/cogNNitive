/**
 * S4b gate (change-provenance: the record is deleted; replacement before
 * deletion).
 *
 * The persisted lineage record no longer exists in core or mcp: no
 * `findLineageRecord`, no `sync_lineage` tool, no `LINEAGE_DRIFT`, and no
 * `lineage` field on the `check_domain` report. `read_lineage` and
 * `check_domain.provenance` are the replacements.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toolDefinitions } from '../src/server.js'
import { roleOf } from '@cognnitive/nn-core'

const RETIRED = /findLineageRecord|sync_lineage|LINEAGE_DRIFT/
const here = dirname(fileURLToPath(import.meta.url))

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.spec\.ts$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

describe('the lineage record is retired', () => {
  it('registers read_lineage and not sync_lineage', () => {
    const names = toolDefinitions.map((tool) => tool.name)
    expect(names).toContain('read_lineage')
    expect(names).not.toContain('sync_lineage')
  })

  it('treats a cogNNitive document as ordinary knowledge', () => {
    expect(roleOf({ path: 'Acme_cogNNitive_NN.md', parentSpecName: 'cogNNitive_V_0-1-0' })).toBe('knowledge')
  })

  it('has no record symbols in live code', () => {
    const roots = [join(here, '..', 'src'), join(here, '..', '..', 'nn-core', 'src')]
    const offenders: string[] = []
    for (const root of roots) {
      for (const file of walk(root)) {
        const source = readFileSync(file, 'utf-8')
        if (RETIRED.test(source)) offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })
})
