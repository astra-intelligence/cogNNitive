import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

/**
 * S4c gate (change-provenance: the record is retired).
 *
 * Live code, skills and specs (archive excluded) must not name the persisted
 * lineage record or its tools. Test files are excluded: they assert the absence.
 */

const ROOT = path.resolve(import.meta.dirname, '..')
const RETIRED = /lineage-record|findLineageRecord|sync_lineage|LINEAGE_DRIFT/

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'archive', '.git', 'temp', '.verify-logs'])
const EXCLUDED_FILE = /(\.spec\.ts|\.test\.(ts|js|mjs)|\.generated\.(js|cjs|ts)|\.bundle\.js|_sidecar_NN\.md|domaiNN_console\.html)$/

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (!EXCLUDED_FILE.test(entry.name)) yield full
  }
}

const ROOTS = [
  path.join(ROOT, 'iNNfo', 'packages', 'nn-core', 'src'),
  path.join(ROOT, 'iNNfo', 'packages', 'nn-mcp', 'src'),
  path.join(ROOT, 'skills'),
  path.join(ROOT, 'iNNfo', 'specs'),
  path.join(ROOT, 'scripts'),
]

test('live code, skills and specs name no retired lineage-record symbol', () => {
  const offenders = []
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue
    for (const file of walk(root)) {
      const source = fs.readFileSync(file, 'utf8')
      if (RETIRED.test(source)) offenders.push(path.relative(ROOT, file))
    }
  }
  assert.deepEqual(offenders, [])
})

test('the cogNNitive blueprint and its catalog entry are gone', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'iNNfo', 'specs', 'bluepriNNts', 'cogNNitive')), false)
  const catalog = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'iNNfo', 'specs', 'bluepriNNts', 'catalog.json'), 'utf8'),
  )
  const names = JSON.stringify(catalog)
  assert.equal(/cogNNitive\/spec_NN\.md/.test(names), false, 'catalog still references the blueprint')
})
