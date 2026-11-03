/**
 * `replayMutations` (change-provenance: Strict mode).
 *
 * Strict drift replays the applied changes of a model from its `add_model`
 * skeleton. Doing that through `applyMutation` per op clones the whole model on
 * every op (quadratic); the replay clones once and runs every op on one draft.
 * The output must equal the sequential result, op for op.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseKnowledge } from '../../src/parser/core.js'
import { serializeKnowledge } from '../../src/parser/index.js'
import { applyMutation, replayMutations } from '../../src/mutate.js'

const MODEL = `---
level: 3
parent_spec:
  name: strategy
  url: "https://example.test/strategy/spec_NN.md"
knowledge_version: "V_0-1-0"
title: "Strategy"
---

# NN index

# NN Concept 1

## NN Concept 1: Goal 1

owner:: Ana
`

const OPS = [
  { op: 'add_element', args: { conceptName: 'Concept 1', elementName: 'Goal 2' } },
  { op: 'update_field', args: { conceptName: 'Concept 1', elementName: 'Goal 2', fieldName: 'owner', value: 'Bea' } },
  { op: 'update_element_text', args: { target: 'strategy@goal-1', text: 'Prose body' } },
  { op: 'rename_element', args: { conceptName: 'Concept 1', elementName: 'Goal 2', newName: 'Goal Two' } },
  { op: 'update_field', args: { conceptName: 'Concept 1', elementName: 'goal-1', fieldName: 'owner', value: 'Carla' } },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('replayMutations', () => {
  it('equals the sequential applyMutation output', () => {
    const sequential = parseKnowledge(MODEL)
    for (const { op, args } of OPS) {
      expect(applyMutation(sequential, op, args).success).toBe(true)
    }

    const original = parseKnowledge(MODEL)
    const replay = replayMutations(original, OPS)
    expect(replay.success).toBe(true)
    expect(replay.results).toHaveLength(OPS.length)
    expect(replay.results.every((r) => r.success)).toBe(true)
    expect(serializeKnowledge(replay.model)).toBe(serializeKnowledge(sequential))
  })

  it('clones the model exactly once for the whole replay', () => {
    const model = parseKnowledge(MODEL.replace(/\n## NN Concept 1: Goal 1\n\nowner:: Ana\n/, '\n'))
    expect([...model.elements.entries()].flatMap(([, list]) => list)).toHaveLength(0)

    const spy = vi.spyOn(globalThis, 'structuredClone')
    replayMutations(model, [
      { op: 'generate_index', args: {} },
      { op: 'generate_index', args: {} },
      { op: 'generate_index', args: {} },
      { op: 'generate_index', args: {} },
    ])
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('leaves the input model untouched and reports a failing op without stopping', () => {
    const model = parseKnowledge(MODEL)
    const before = serializeKnowledge(model)
    const replay = replayMutations(model, [
      { op: 'update_field', args: { conceptName: 'Concept 1', elementName: 'missing', fieldName: 'owner', value: 'X' } },
      { op: 'update_field', args: { conceptName: 'Concept 1', elementName: 'goal-1', fieldName: 'owner', value: 'Bea' } },
    ])

    expect(serializeKnowledge(model)).toBe(before)
    expect(replay.success).toBe(false)
    expect(replay.results[0].success).toBe(false)
    expect(replay.results[1].success).toBe(true)
    expect(replay.model.elements.get('Concept 1')?.[0].fields.owner).toBe('Bea')
  })
})
