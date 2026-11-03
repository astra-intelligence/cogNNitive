import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

/**
 * S6c docs gate (change-provenance: docs and vocabulary describe change-based
 * provenance).
 *
 * The user-facing documentation under `docs/documentation/content/` must not
 * teach the removed surfaces: the persisted record, the record CLI flags,
 * `sources::` as authoring syntax, or the retired tool names.
 *
 * `docs/cognitive_nn/` is a corpus of demo domains: its models stay valid under
 * the L1 they pin, exactly like the shipped samples.
 */

const ROOT = path.resolve(import.meta.dirname, '..')
const CONTENT = path.join(ROOT, 'docs', 'documentation', 'content')

const FORBIDDEN = [
  'sync_lineage',
  '--lineage',
  'get_lineage',
  'update_description',
  'sources::',
  'lineage record',
]

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(md|json)$/.test(entry.name)) yield full
  }
}

test('no user-facing doc teaches a removed provenance surface', () => {
  const offenders = []
  for (const file of walk(CONTENT)) {
    const text = fs.readFileSync(file, 'utf8')
    for (const term of FORBIDDEN) {
      if (text.includes(term)) offenders.push(`${path.relative(ROOT, file)}: ${term}`)
    }
  }
  assert.deepEqual(offenders, [])
})

test('the docs name the change-based capabilities', () => {
  const corpus = [...walk(CONTENT)]
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n')
  for (const term of ['read_lineage', 'produce_artifact', 'evidence']) {
    assert.ok(corpus.includes(term), `docs must mention ${term}`)
  }
})

test('the vocabulary defines lineage as computed from changes', () => {
  const vocabulary = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'iNNfo', 'specs', 'vocabulary.json'), 'utf8'),
  )
  const sense = vocabulary.terms?.lineage?.sense ?? ''
  assert.ok(sense.length > 0, 'the vocabulary defines `lineage`')
  assert.match(sense, /computed|applied changes|change log/i)
  assert.doesNotMatch(sense, /persisted lineage record/i)
})
