/**
 * The projection's log-derived half (change-provenance: one reader for lineage).
 *
 * Inventory comes from the filesystem (sidecars, models, artifacts); EDGES come
 * from the change log: the live evidence of each unit by default, every applied
 * change with `scope: 'all-time'`. A non-regenerable artifact with no
 * `produce_artifact` change is `ARTIFACT_WITHOUT_RECORD`. Nothing is written.
 */
import { describe, it, expect } from 'vitest'
import { projectLineage } from '../../src/lineage/project.js'
import { buildChangeLogFromChangesets } from '../../src/changelog/load.js'
import type { FileSnapshot } from '../../src/queryUnits.js'

const MODEL = `---
level: 3
parent_spec:
  name: "TestLab_V_0-1-0"
  url: "specs/TestLab_NN.md"
knowledge_version: "V_0-1-0"
title: "Goal Model"
---

# NN Concept 1
## NN Concept 1: Goal 1
slug:: goal-1
owner:: Bea
`

const changeset = (changes: Array<Record<string, unknown>>) => ({
  path: 'changes/dom_agent_20261010T120000Z_changes_NN.md',
  status: 'applied',
  author: 'lucas',
  appliedAt: '2026-10-10T12:00:00.000Z',
  changes,
})

const files: FileSnapshot[] = [
  { path: 'kNNowledge/goal_NN.md', content: MODEL },
  {
    path: 'changes/dom_agent_20261010T120000Z_changes_NN.md',
    content: `---
spec_version: "V_0-4-0"
level: 3
parent_spec:
  name: changes
  url: "https://example.test/changes/spec_NN.md"
blueprint_version: "V_0-6-0"
status: applied
title: "Goal Changes"
---

# NN Change

## NN Change: c-01
op:: update_field
target:: goal@goal-1&owner
to:: Ana
evidence:: sources/import/a.md

## NN Change: c-02
op:: update_field
target:: goal@goal-1&owner
to:: Bea
evidence:: sources/import/b.md

## NN Change: c-03
op:: produce_artifact
target:: artifacts/brief.md
resolved_target:: artifacts/brief.md
evidence:: sources/import/b.md
`,
  },
  { path: 'sources/import/a.md', content: '# A\n' },
  { path: 'sources/import/b.md', content: '# B\n' },
  { path: 'artifacts/brief.md', content: '# Brief\n' },
  { path: 'README.md', content: 'loose\n' },
  { path: 'artifacts/staging/hidden.md', content: 'staged\n' },
]

const liveLog = buildChangeLogFromChangesets([
  changeset([
    { id: 'c-01', op: 'update_field', target: 'goal@goal-1&owner', to: 'Ana', evidence: 'sources/import/a.md' },
    { id: 'c-02', op: 'update_field', target: 'goal@goal-1&owner', to: 'Bea', evidence: 'sources/import/b.md' },
    {
      id: 'c-03',
      op: 'produce_artifact',
      target: 'artifacts/brief.md',
      resolved_target: 'artifacts/brief.md',
      evidence: 'sources/import/b.md',
    },
  ]),
])

const evidenceEdges = (view: ReturnType<typeof projectLineage>) =>
  view.edges
    .filter((edge) => edge.kind === 'evidence')
    .map((edge) => [edge.from, edge.to, edge.change])
    .sort((a, b) => a.join('|').localeCompare(b.join('|')))

describe('projectLineage edges', () => {
  it('uses live evidence by default: a superseded source has no edge', () => {
    const view = projectLineage(files, liveLog)
    expect(evidenceEdges(view)).toEqual([
      ['sources/import/b.md', 'artifacts/brief.md', 'c-03'],
      ['sources/import/b.md', 'kNNowledge/goal_NN.md', 'c-02'],
    ])
    expect(evidenceEdges(view).some(([from]) => from === 'sources/import/a.md')).toBe(false)
  })

  it('keeps superseded evidence with scope all-time', () => {
    const view = projectLineage(files, liveLog, { scope: 'all-time' })
    expect(evidenceEdges(view)).toEqual([
      ['sources/import/a.md', 'kNNowledge/goal_NN.md', 'c-01'],
      ['sources/import/b.md', 'artifacts/brief.md', 'c-03'],
      ['sources/import/b.md', 'kNNowledge/goal_NN.md', 'c-02'],
    ])
  })

  it('records the production edge of a produce_artifact change', () => {
    const view = projectLineage(files, liveLog)
    const produced = view.edges.filter((edge) => edge.kind === 'produced')
    expect(produced).toEqual([
      { from: 'artifacts/brief.md', to: 'changes/dom_agent_20261010T120000Z_changes_NN.md', kind: 'produced', change: 'c-03' },
    ])
  })

  it('drops a target edge whose model is not in the inventory', () => {
    const view = projectLineage(files, liveLog)
    const targets = view.edges.filter((edge) => edge.kind === 'target')
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.every((edge) => edge.to.startsWith('kNNowledge/') || edge.to.startsWith('artifacts/'))).toBe(true)
  })
})

describe('projectLineage artifacts and diagnostics', () => {
  it('warns about a non-regenerable artifact with no produce_artifact change', () => {
    const view = projectLineage(
      [...files, { path: 'artifacts/Report_20261002T101500Z.md', content: '# Report\n' }],
      liveLog,
    )
    const codes = view.diagnostics.filter((d) => d.code === 'ARTIFACT_WITHOUT_RECORD').map((d) => d.path)
    expect(codes).toEqual(['artifacts/Report_20261002T101500Z.md'])
  })

  it('does not warn for a recorded artifact nor for a regenerable view', () => {
    const view = projectLineage(
      [...files, { path: 'artifacts/Domain_console/index.html', content: '<html></html>' }],
      liveLog,
    )
    expect(view.diagnostics.filter((d) => d.code === 'ARTIFACT_WITHOUT_RECORD')).toEqual([])
  })

  it('keeps loose markdown and staging out of the inventory', () => {
    const view = projectLineage(files, liveLog)
    const paths = [
      ...view.sources.map((s) => s.raw_filename),
      ...view.knowledge.map((k) => k.model_ref),
      ...view.artifacts.map((a) => a.artifact_ref),
    ]
    expect(paths).not.toContain('README.md')
    expect(paths.some((p) => p.includes('staging'))).toBe(false)
  })

  it('projects a changeset as a lineage node and writes nothing', () => {
    const view = projectLineage(files, liveLog)
    expect(view.changesets.map((c) => c.changeset_ref)).toEqual(['changes/dom_agent_20261010T120000Z_changes_NN.md'])
    expect(view.changesets[0].status).toBe('applied')
    expect(view.changesets[0].changes).toEqual(['c-01', 'c-02', 'c-03'])
  })

  it('builds its own log when none is supplied', () => {
    const view = projectLineage(files)
    expect(view.edges.length).toBeGreaterThan(0)
    expect(view.knowledge).toHaveLength(1)
  })
})
