/**
 * Provenance ban on L3 (change-provenance A13 / provenance-vocabulary).
 *
 * A kNNowledge document declares no citation syntax of its own: `sources::` is
 * banned, a `type:: citation` field is banned, the one allowed `citation` is
 * `changes.evidence` (identified by the parent blueprint, never by an exemption
 * list), and `conflicts::` is an address.
 */
import { describe, it, expect } from 'vitest'
import { parseKnowledge } from '../../src/parser/core.js'
import { resolveBlueprintSchema } from '../../src/schema/index.js'
import { checkProvenanceBan } from '../../src/validator/knowledge-checks.js'
import { Diagnostics } from '../../src/diagnostics.js'

const BLUEPRINT = `---
spec_version: "V_0-5-0"
level: 2
blueprint_version: "V_0-1-0"
title: "Business"
parent_spec:
  name: "iNNfo_V_0-5-0"
  url: "https://example.test/iNNfo_V_0-5-0_NN.md"
---

# NN Concept Definition
## NN Concept Definition: Goal
type:: list

# NN Field Definition
## NN Field Definition: evidence_source
concept:: Goal
type:: citation

# NN Field Definition
## NN Field Definition: conflicts
concept:: Goal
type:: address

# NN Field Definition
## NN Field Definition: statement
concept:: Goal
type:: string
`

function run(modelMarkdown: string): { codes: string[]; messages: string[] } {
  const model = parseKnowledge(modelMarkdown)
  const schema = resolveBlueprintSchema(BLUEPRINT, () => null).schema
  const d = new Diagnostics()
  checkProvenanceBan(model, schema, d)
  const result = d.result()
  return {
    codes: result.errors.map((e) => e.code ?? ''),
    messages: result.errors.map((e) => e.message),
  }
}

const MODEL = (fields: string, parent = 'business_V_0-6-0') => `---
level: 3
parent_spec:
  name: "${parent}"
  url: "https://example.test/iNNfo_V_0-6-0_NN.md"
knowledge_version: "V_0-1-0"
title: "Plan"
---

# NN Goal
## NN Goal: Reach the market
slug:: reach-the-market
${fields}
`

describe('checkProvenanceBan', () => {
  it('bans a sources:: field on L3', () => {
    const { codes } = run(MODEL('sources:: [sources/import/a.md]'))
    expect(codes).toContain('SOURCES_FIELD_BANNED')
  })

  it('bans a type:: citation field on L3', () => {
    const { codes } = run(MODEL('evidence_source:: sources/import/a.md'))
    expect(codes).toContain('CITATION_FIELD_BANNED')
  })

  it('allows the one citation: changes.evidence (identified by the parent blueprint)', () => {
    const changesModel = `---
level: 3
parent_spec:
  name: "changes"
  url: "https://example.test/changes/spec_NN.md"
knowledge_version: "V_0-1-0"
title: "Changes"
---

# NN Change
## NN Change: c-01
op:: update_field
target:: plan@goal&statement
to:: x
evidence:: sources/import/a.md
`
    expect(run(changesModel).codes).toEqual([])
  })

  it('accepts conflicts:: only as an address and reports a plain pointer', () => {
    const address = run(MODEL('conflicts:: plan@other-goal&statement'))
    expect(address.codes).not.toContain('CITATIONS')
    expect(address.codes).not.toContain('CITATION_FIELD_BANNED')

    const pointer = run(MODEL('conflicts:: sources/import/a.md@## X'))
    expect(pointer.codes).toEqual([])
  })

  it('is silent on a banned field when the document is not L3', () => {
    const l2 = `---
level: 2
parent_spec:
  name: "iNNfo_V_0-5-0"
  url: "https://example.test/iNNfo_V_0-5-0_NN.md"
blueprint_version: "V_0-1-0"
title: "Template"
---

# NN Concept Definition
## NN Concept Definition: Goal
type:: list
sources:: sources/import/a.md
`
    expect(run(l2).codes).toEqual([])
  })
})
