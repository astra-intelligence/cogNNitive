import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

/**
 * S6a skill content gate (change-provenance: the skills describe change-based
 * provenance).
 *
 * `nn-sources` and `nn` must not teach the removed surfaces (the persisted
 * record, the record CLI flags, `sources::` as authoring syntax) and must name
 * the capabilities that replaced them.
 */

const ROOT = path.resolve(import.meta.dirname, '..')
const SKILLS = [
  path.join(ROOT, 'skills', 'nn-sources', 'SKILL.md'),
  path.join(ROOT, 'skills', 'nn', 'SKILL.md'),
  path.join(ROOT, 'skills', 'nn-innfo', 'SKILL.md'),
]

const FORBIDDEN = [
  'sync_lineage',
  '--lineage',
  'get_lineage',
  'update_description',
  'sources::',
  'persisted lineage record',
  'lineage record',
]

const REQUIRED = ['read_lineage', 'update_element_text', 'produce_artifact']

for (const file of SKILLS) {
  const name = path.relative(ROOT, file)

  test(`${name} names no removed provenance surface`, () => {
    const content = fs.readFileSync(file, 'utf8')
    const offenders = FORBIDDEN.filter((term) => content.includes(term))
    assert.deepEqual(offenders, [], `${name} still mentions: ${offenders.join(', ')}`)
  })

  test(`${name} names the change-based capabilities`, () => {
    const content = fs.readFileSync(file, 'utf8')
    for (const term of REQUIRED) {
      assert.ok(content.includes(term), `${name} must mention ${term}`)
    }
  })
}
