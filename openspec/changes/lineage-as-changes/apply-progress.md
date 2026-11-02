# Apply progress: lineage-as-changes

Appended per PR. Newest entries at the end. Nothing in this file replaces a
previous entry.

---

## PR 1-3 â€” S0a / S0b / S0c (branch chain `lac/s0a` â†’ `lac/s0b` â†’ `lac/s0c`)

Applied: 2026-11-02. Status: implemented, green, pushed; PRs opened against the chain.

### Slice decision (deviation, maintainer-approved)

S0 was planned as one PR of ~300 changed lines. Measured after implementation it
was ~1,376 hand-authored lines (1,417+/582- excluding the generated console
mirror), 3.4x the budget, so it was stopped and reported. The maintainer chose to
split it into three chained sub-PRs. `tasks.md` now carries S0a/S0b/S0c and the
chain is renumbered 1..32 (every later PR moved by +2).

### S0a â€” `changelog/` module and console rewire (PR 1, `lac/s0a`)

Tasks: 0.1, 0.2, 0.3, 0.4, 0.5.

- New `core/changelog/{order,load,index,node}.ts`: `compareChanges` (applied_at â†’
  filename UTC stamp â†’ filename â†’ document index), `buildChangeLog(files)` plus
  `buildChangeLogFromChangesets(records)` for the console transport,
  `createChangeLog`, `history(unit)`, `origin(unit)`, `tombstones` (empty stub
  until S2a), `unitOf` (`resolved_target` when stamped, else `target`).
- `naming/contract.ts` gains `changesetStampOf(nameOrPath)` so the changeset stamp
  has ONE definition (the NN Name Regex Guard rejected the local regexes).
- Console: `provenance.ts` (`deriveValueHistory`, `deriveFieldOrigin`,
  `detectUnrecordedEdits` over the log), `element-history.ts` (applied-only
  per-field `provenance`, every-status element history, exact element-part
  matching â€” `a-b` never matches `ab`), `payload-builder.ts` (element
  `provenance` type), `console/index.ts` (exports the log builder for the
  payload mirror), `scripts/export-console.mjs` (builds the log for the drift
  warning).
- Files touched: the above plus `core/index.ts`, `core/browser.ts`, tests
  (`tests/changelog/{order,log}.test.ts`, `tests/console/provenance.test.ts`,
  `tests/console-element-history.test.ts`) and the regenerated
  `console-payload.generated.cjs`, `naming-contract.generated.cjs`,
  `nn-core.generated.cjs` (generated, excluded from the budget).
- Size: 1,204+/447- total, of which 623 lines are the three generated mirrors â†’
  ~1,028 hand-authored (~390 of them tests). Declared in `tasks.md` and in the PR
  body.
- Verification: `vitest run tests/changelog tests/console
  tests/console-element-history tests/mutate` â†’ 43 files / 327 tests green;
  `tsc --noEmit` (core) clean; `npm run verify:fast` green on the tip.

### S0b â€” `sources` out of the change model (PR 2, `lac/s0b`)

Tasks: 0.6, 0.7.

- `core/mutate.ts`: `rewriteFieldCitation` deleted; the `add_element` `sources`
  argument is no longer mapped into a field (it stays in the reserved-key set so
  the generic copy cannot smuggle it in). `core/index.ts` drops the export.
- `mcp/tools/propose-changeset.ts`: a `sources` key is rejected with
  `INVALID_OPERATION` pointing at `evidence`; `evidence` stays a `STRING_KEYS`
  entry. `mcp/server.ts` tool description corrected (no `sources`).
- `skills/nn-sources/scripts/lib/convergence-delta.js`: the apply plan emits
  `evidence`, never `sources` (and its two tests updated).
- Size: 63+/135- (198 lines).
- Verification: `vitest run tests/mutate` 19 passed; `src/tools/propose-changeset`
  24 passed; `convergence-delta.test.js` and `convergence-cli.test.js` pass;
  `npm run verify:fast` green on the tip.

### S0c â€” `EVIDENCE_UNKNOWN` (PR 3, `lac/s0c`)

Tasks: 0.8, 0.9, 0.10.

- `mcp/tools/validate.ts`: `collectEvidenceDiagnostics(rootDir)` emits one
  warning per APPLIED change whose evidence is absent or `unknown`, naming the
  change, its author and its target, filed against the model document the change
  targets. Wired into `collectWorkspaceDiagnostics`, so `validate_knowledge`
  workspace mode and `check_domain`'s per-model validation both carry it.
- `mcp/tools/check-workspace.ts`: `check_domain` also returns the flat
  `evidence` list (renamed into `provenance` in S2b.2).
- Size: 150+/0-.
- Verification: `vitest run src/tools/validate` 15 passed (including the
  130-change LC_programas-like case); `tsc --noEmit` (nn-mcp) clean;
  `npm run verify:fast` green on the tip.

### Deviations and open items

1. S0 landed as three PRs instead of one (maintainer-approved split; see above).
2. `buildChangeLogFromChangesets` exists next to `buildChangeLog(files)`: the
   console payload builder receives parsed changesets, not file snapshots, and
   re-reading the filesystem would break its browser-safety. Both funnel into the
   same log and the same comparator.
3. `unitOf` falls back to the change's own `target` because `resolved_target` is
   only stamped from S1b.1 (PR 5). Once stamping lands, the stamped value wins.
4. `detectUnrecordedEdits` (the console's drift warning) matches on the element
   part of the address, not the full model-scoped unit: the domain console
   aggregates models whose authored target model parts vary. The validator's
   `checkProvenance` (S2a.2) replaces it with model-scoped drift.
5. Environment: this session worktree had no `node_modules` at all and the primary
   install has no `node_modules/.bin`. I linked per-entry junctions (root
   `node_modules`, `@cognnitive/*` â†’ this worktree's packages, `skills/nn-sources/
   node_modules`) and run `vitest`/`tsc`/`tsup` through their package entry files.
   `npm run verify:fast` works because it invokes node scripts and
   `node_modules/typescript/bin/tsc` directly. `npm --workspace=â€¦ test` and the
   pre-push hook's `npm run typecheck` cannot resolve bins; the maintainer
   approved pushing with `--no-verify` for this chain while the shims are absent.
   Typecheck is run explicitly and is green for both packages.
6. A local `tsup` build rewrites the tracked `iNNfo/packages/nn-mcp/bin/
   nn-mcp.bundle.js`; it was restored to the base bytes and is NOT part of any PR.
7. The S0 documentation commit (the split) was authored after S0b/S0c branched.
   The chain was rebased so every later branch carries it: `lac/s0b` onto
   `lac/s0a`, `lac/s0c` onto `lac/s0b`, `lac/s1a` onto `lac/s0c`, then the three
   pushed branches were force-pushed with `--force-with-lease`.

---

## PR 4 â€” S1a (branch `lac/s1a`, base `lac/s0c`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 1a.1, 1a.2, 1a.3, 1a.4, 1a.5, 1a.6, 1a.7.

- `core/changeset/evidence.ts`: `splitEvidence` (via `splitSourceFieldValue`),
  `EVIDENCE_KEYWORDS`, `evidenceKeywordInList`. A keyword beside another entry
  throws `EVIDENCE_KEYWORD_IN_LIST`; keywords normalise to lowercase and are valid
  only alone.
- `core/changeset/{types,parser,serializer,hasher}.ts`: `ChangeItem` gains `seed`,
  `resolved_target`, `evidence_sha256`; `EXECUTION_FACT_KEYS` is the single
  exported list and the serializer's annotation regex is derived from it;
  `PROPOSAL_KEYS` gains `seed` and loses `fields`; `seed` and the two facts round
  trip (`seed:: {json}`, `evidence_sha256:: [a, b]`).
- `iNNfo/specs/bluepriNNts/changes/spec_NN.md`: `blueprint_version` `V_0-5-5` â†’
  `V_0-6-0`; op select gains `update_element_text` and `produce_artifact`;
  `fields` field removed; `seed` / `resolved_target` / `evidence_sha256` /
  `applied_at` / `batch` declared; prose updated (ops, seed, evidence list,
  execution facts); template repinned to `V_0-6-0`. `evidence` stays `citation`.
- Regenerated: `bluepriNNts/catalog.json`, `core/schema/canonical-registry.ts`,
  `console-payload.generated.cjs` (generated, excluded from the budget).
- Size: ~542 total, of which ~91 are generated â†’ ~451 hand-authored (declared
  over 400; the forecast was ~350).
- Verification: `vitest run tests/changeset` â†’ 16 files / 100 tests green;
  `tsc --noEmit` clean; eslint 0 errors; `node scripts/verify.js` fully green
  (224 steps).

### Deviations

8. `SHIPPED_TEMPLATE_VERSIONS` does not exist in this repository, and
   `template_version` is only read for frozen bluepriNNts (`blueprint-catalog.mjs`
   line 251). `changes` is catalogued by `blueprint_version`, so the bump went
   there (`V_0-6-0`) and `spec_version` stayed at the L1 pin. Task 1a.6's
   `template_version`/`SHIPPED_TEMPLATE_VERSIONS` step therefore does not apply.
9. `fields` was removed from `PROPOSAL_KEYS` but is still parsed and serialized:
   rejecting it outright is task 1b.5 (PR 8), and removing it from the model now
   would break every emitter before S1b.3 (PR 7) stops sending it.

---

## PR 5 â€” S1b.1 (branch `lac/s1b1`, base `lac/s1a`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 1b.1, 1b.2, 1b.3, 1b.4, 1b.13a.

- `core/changeset/resolved-target.ts`: `resolvedTarget.{field,body,cell,concept,element,artifact}`,
  `canonicalUnitModelId` (drops a trailing `_V_x-y-z`), `axisSlug` (frozen slug of the
  element named by the label, else `slugify`). Named `canonicalUnitModelId` because
  `canonicalModelId` already exists in `naming/`.
- `mcp/tools/apply-change.ts`: after the mutations run, every APPLIED change is
  stamped with `resolved_target` read from the post-mutation model (frozen slug,
  not the address label) and with `evidence_sha256` (one sha per evidence entry, in
  order, `undefined` for `decision`/`unknown` or an unreadable file). Non-applied
  changes have both facts deleted, so a proposal that pre-carried them cannot leak
  into the log. `applied_at` is clamped to `max(now, latest + 1 ms)` and shared by
  the batch.
- `mcp/tools/propose-changeset.ts` + `mcp/tools/apply-change.ts`: evidence is
  resolved **per entry** (`splitEvidence`), so a bracketed list resolves at intake
  and at apply, and a keyword in a list is rejected with
  `EVIDENCE_KEYWORD_IN_LIST`.
- Size: ~540 (198 of them tests). Declared over 400; forecast was ~200.
- Verification: `vitest run src/tools/apply-change-facts` 6 passed; the whole
  nn-mcp suite 51 files / 614 tests green; `vitest run tests/changeset` green;
  both packages typecheck; `npm run verify:fast` green.

### Deviations

10. The address builder lives in its own module (`resolved-target.ts`) instead of
    next to `unitAddress` in `console/`: the console barrel is mirrored into the
    payload bundle, and the changeset module is where the apply-time grammar
    belongs. `unitAddress` is not reused because it has no body (`&#body`) or
    version-token form.
11. Evidence list resolution was not in S1a's task list but is required for the
    list grammar to work end to end; it landed here because this PR is where the
    apply engine reads evidence.

---

## PR 6 â€” S1b.2 (branch `lac/s1b2`, base `lac/s1b1`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 1b.7, 1b.8, 1b.9, 1b.10, 1b.13b.

- `add_matrix` reads its headers from the sealed `seed` (`{columns, rows}`): empty
  cells, no cell units. `seed` is refused on any other op at proposal and at apply.
- `produce_artifact`: path target, no model load, no version bump (`models: {}`),
  `resolved_target` = the POSIX artifact path, author = the producing procedure. The
  target must be a safe, existing workspace path that is not a model, changeset or
  sidecar (`ARTIFACT_INVALID_PATH` / `ARTIFACT_NOT_FOUND`, the latter leaving the
  changeset `proposed`). A second applied record for the same path is
  `ARTIFACT_ALREADY_RECORDED` (conflict, via `blockedChanges`).
- `CHANGE_OPS` gains `produce_artifact`; `partitionChangeset` treats it as
  model-free; the direct-operations test lists it as apply-only.
- Size: ~300 hand-authored lines (implementation + two spec files). Inside budget.
- Verification: `vitest run src/tools/produce-artifact` 6 passed; nn-mcp 52 files /
  620 tests; `vitest run tests/changeset` 113; both typecheck; `verify:fast` green.

### Deviation

12. `update_element_text` is not yet in `CHANGE_OPS`: the closed-set test requires
    every op to be either a mutation or apply-only, and its mutation lands in
    S1b.4 (PR 8). Adding it there keeps the partition invariant true at every PR.

---

## Handoff â€” start here next session

Chain state: `lac/s1b2` is the tip (PR 6, #448). Next branch: `git switch -c lac/s1b3` from `lac/s1b2`.

**PR 7 â€” S1b.3 (emitters stop sending `fields`)**

Known locations from the survey done at the end of this session:

- `skills/nn-sources/scripts/lib/convergence-delta.js` â†’ `buildApplyPlan` (around
  line 280): emits `add_element` with `fields` + `evidence`. Change it to emit
  `add_element` (op/target/concept/name only) followed by one `update_field`
  (`target: model@slug&field`, `to`, `evidence`, **no `from`**) per field, and
  `add_matrix` with `seed: {columns, rows}` instead of `fields.columns/rows`.
  Its tests are `scripts/lib/convergence-delta.test.js` and
  `scripts/lib/convergence-cli.test.js` (both assert the exact plan today).
- Console emitters: the draft â†’ changeset mapping lives in
  `iNNfo/specs/bluepriNNts/console/review.js` (drafts carry `kind: 'new'` with
  `proposed` holding the initial fields, set in `openNew` around line 1027) and
  the display half in `ui-kit.js` (`cardDiff`, line ~2040, reads `e.fields`).
  `scripts/export-console.mjs` (~line 1215) carries the same shape. Find the
  operation builder with `rg "add_element" iNNfo/specs/bluepriNNts/console/*.js`.
  After editing: `node scripts/build-console-bundle.mjs` and the golden parity
  suites (`test/console-*.test.mjs`).
- Expected shape per task 1b.11: `add_element` then N `update_field` with no
  `from`, each with its own `evidence`; `add_matrix` emits `seed`.

**Then:** PR 8 (S1b.4) adds `update_element_text` to `CHANGE_OPS`, implements
`updateElementText` in `core/mutate.ts` (`ElementNode.description`, `from`
precondition, `USE_UPDATE_ELEMENT_TEXT` on `update_field â€¦&description`), stops
`add_element` copying `notes` into the prose, and rejects `fields` at proposal and
apply. After that the fold engine (S2a.1) starts, which is where the change
becomes real.

Note on `tasks.md`: task 1b.13's mirror/gate steps are per PR; the console bundle
and payload mirror must be regenerated whenever `console/` changes.

---

## PR 7 â€” S1b.3 (branch `lac/s1b3`, base `lac/s1b2`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR #449 opened.

Tasks: 1b.11, 1b.12, 1b.13c.

- `skills/nn-sources/scripts/lib/convergence-delta.js` (`buildApplyPlan`): each added
  key emits `add_element` (op/target/concept/name/evidence) and then one
  `update_field` per field, alphabetically, with `to` and its own `evidence` and no
  `from` (the field does not exist yet). Changed values keep their `from`
  precondition and still go to `review` under `upsert`. Both tests updated
  (`convergence-delta.test.js`, `convergence-cli.test.js`) and now assert the
  field-less shape.
- Console emitter `iNNfo/specs/bluepriNNts/console/nn-runtime.js`: `draftToChange`
  became `draftToChanges`, returning the `add_element` block plus one
  `update_field` block per filled field (target `<model>@<element slug>&<field>`,
  `to`, the same evidence, distinct `## NN Change:` id). `serializeChangesetMarkdown`
  flattens the per-draft block lists. The add_element branch no longer writes
  `fields::`.
- `ui-kit.js` `cardDiff`: an applied `add_element` shows the element name, not
  inline fields; an unsent `kind: 'new'` draft still previews its `proposed` map.
- `openspec/specs/console-review-mode/spec.md`: the "New element draft"
  requirement and scenario now describe `add_element` + `update_field` and no
  `fields`.
- Regenerated: `console/nn-console.bundle.js` and
  `test/fixtures/testlab/domaiNN_console.html` (generated, excluded from the budget).
- Size: 125 changed lines total (102+/23-), all hand-authored; generated artifacts
  excluded. Well inside the 400-line budget.
- Verification: `node scripts/lib/convergence-delta.test.js` and
  `convergence-cli.test.js` green; `node test/console-review.test.mjs` 24 passed;
  all 40 `test/console-*.test.mjs` suites green; application-level
  `vitest run console` in nn-core (43 files / 305 tests) green;
  `npm --prefix skills/nn-sources test` 654 passed; `npm run verify:fast` fully
  green (224 steps).

### Deviations

13. The console changeset emitter lives in `nn-runtime.js` (`draftToChanges`), not in
    `review.js` or `scripts/export-console.mjs`: `review.js` only stores the draft
    (`proposed`), and `export-console.mjs` builds the payload. The handoff file map
    was approximate. `ui-kit.js` carries the display half, as expected.
14. `add_matrix` with `seed`: no emitter in the repository emits `add_matrix` today
    (`rg add_matrix` finds only the engine, the blueprint, tests and fixture data).
    The seed path is already implemented and tested at the engine (PR 6); the script
    emitters that will need it are `migrate-domain.js` / the script-from-draft path,
    which is task 5b.5b (PR 28). No emitter writes `fields` any more, which is the
    invariant this slice establishes.
15. `openspec/specs/console-review-mode/spec.md` was updated in this PR because it
    asserted the removed `fields::` export shape. The rest of the living-spec sync
    stays in the archive phase (task 6.4c).
16. The tracked testlab fixture was stale before this chain (console v0.31.0,
    `changesBlueprintVersion: V_0-5-5`); regenerating it now also absorbs S0a's
    console changes and PR 4's blueprint bump (+13 KB of generated diff).
17. A `kind: 'new'` console draft has no `element_slug`, so the creation
    `update_field` targets use the console's `slugify` (the generated nn-slug
    mirror) for the element part. The engine resolves the element by name or slug,
    so ordinary names agree with core's `slugifyHeading`. A name whose console slug
    is empty would fall back to `feedback`; that is a pre-existing console slug
    limitation, unchanged here.

---

## PR 8 â€” S1b.4 (branch `lac/s1b4`, base `lac/s1b3`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR #450 opened.

Tasks: 1b.5, 1b.6, 1b.13d.

- `core/changeset/types.ts`: `update_element_text` joins `CHANGE_OPS` together with its
  mutation (the closed-set test requires the op to be a mutation or apply-only).
- `core/mutate.ts`: `updateElementText` writes `ElementNode.description` (target
  `model@element`, `&#body` accepted), never a `description::` field.
  `updateField` refuses the field name `description` with `USE_UPDATE_ELEMENT_TEXT`.
  `addElement` rejects `args.fields` loudly (pointing at `update_field`) and no longer
  merges inline fields; root-level args still set fields on the direct mutation API.
- `core/changeset/conflicts.ts`: `update_element_text` joins the staleness and
  existence checks and gets its own `from` precondition against the current prose;
  an element added earlier in the same batch is synthesised with an empty prose body.
- `mcp/tools/propose-changeset.ts`: `fields` is rejected on any operation with
  `INVALID_OPERATION` pointing at `update_field`; `update_element_text` shape
  (bare element target, `to` required) is validated; `update_field â€¦&description` is
  rejected with `USE_UPDATE_ELEMENT_TEXT`. `normalizeOperations` no longer accepts
  `fields`.
- `mcp/tools/apply-change.ts`: pre-flight `rejected` for any change carrying `fields`
  (`INVALID_OPERATION`) and for `update_field â€¦&description`
  (`USE_UPDATE_ELEMENT_TEXT`); `update_element_text` mutation args; `add_element` no
  longer passes `notes` as the prose; `resolved_target` for prose is
  `model@slug&#body`; the direct `add_matrix` synthesis emits `seed` (comma lists
  become arrays) instead of `fields`, and a direct `add_element` with `fields` is
  refused.
- `mcp/server.ts`: `update_element_text` in the direct-op enum; propose_changeset
  descriptions updated (no `fields`, prose op documented).
- New tests: `core-tests/changeset/update-element-text.test.ts` (7) and
  `mcp/src/tools/update-element-text.spec.ts` (8: propose/apply rejection, notes,
  field-less add + update_field, prose round trip, prose precondition).
- Stale tests corrected (they asserted behaviour removed by S0b/PR 4 and were red on
  the base):
  - `core/src/mutate.spec.ts`: the H3a "addElement sources propagation" cases become
    "no inline fields / never persists sources / root args still work".
  - `core/tests/workspaceSources.test.ts`: the `add_element sources` round-trip cases
    collapse into one assertion that a `sources` argument is dropped.
  - `core/tests/canonical-registry.test.ts`: `fields` removed from the expected
    `Change` fields (PR 4 removed it from the blueprint).
  - `core/tests/roundtrip-fidelity.test.ts`: a field literally named `description` is
    skipped when choosing the clear target (the prose op owns that name).
  - `mcp/test/apply-change-models.test.ts`, `mcp/test/console-export-roundtrip.test.ts`:
    follow the field-less shape (add_element + update_field; 5 applied changes).
- Regenerated: `console/console-payload.generated.cjs` (one line: the op in
  `CHANGE_OPS`; generated, excluded from the budget).
- Size: ~718 hand-authored changed lines (624+/95-, of which 347 are the two new test
  files) plus 1 generated line. Declared over the 400-line budget (~3.6x the ~200
  forecast); not re-sliced.
- Verification: `vitest run` in nn-core, 199 files / 2,097 tests green; `vitest run`
  in nn-mcp, 53 files / 628 tests green; `tsc -p` (core build, refreshes dist types)
  and `tsc --noEmit` (nn-mcp) clean; `node scripts/build-core-mirrors.mjs` +
  `node --test scripts/build-core-mirrors.test.mjs` green; `npm run verify:fast`
  fully green (202 steps).

### Deviations

18. The task forecast ~200 lines; the real slice is ~718 hand-authored lines, mostly
    tests (347) and the propose/apply guards. Declared, not re-sliced (size policy).
19. Four core tests and two mcp tests were stale RED on the base branch because S0b
    and PR 4 changed behavior without running the full package suites (`mutate.spec.ts`
    sources propagation, `workspaceSources` sources round trip, the canonical registry
    `fields` expectation, and the `description` clear in roundtrip fidelity). They were
    corrected here, in the PR that makes the new contract complete.
20. `update_field` on a field literally named `description` is now refused for ANY
    model, including a sample whose blueprint declares such a field
    (`executive_remediation_report_business_NN.md`). The corpus rebuild in S5b.4
    removes those fields; the roundtrip test skips them until then.
21. `fields` stays on the `ChangeItem` TypeScript type (and in the parser/serializer)
    even though no change may carry it: proposal and apply both reject it loudly, and
    keeping it parseable lets the apply engine produce a specific `INVALID_OPERATION`
    /`rejected` record instead of silently dropping the key. `PROPOSAL_KEYS` already
    excludes it (PR 4). Removing the type field can follow once the corpora are rebuilt.

---

## Handoff â€” start here next session (after PR 8)

Chain state: `lac/s1b4` is the tip (PR 8, #450). Next branch:
`git switch lac/s1b4 && git switch -c lac/s2a1`.

**PR 9 â€” S2a.1 (fold engine: fold and units)** â€” tasks 2a.1 [RED], 2a.2 [GREEN], 2a.9a.

- Create `core/changelog/fold.ts` and `core/changelog/units.ts`; `buildChangeLog`
  folds APPLIED changes into `Map<UnitKey, UnitState>` in O(C+U), with the epoch cut
  (a new element reusing a slug starts empty) and lazy relink events.
- One test case per row of design A4 (`openspec/changes/lineage-as-changes/design.md`,
  section A4): `add_element` (alive, no units), `update_field` (`to`; `''` removes),
  prose/concept/cell updates (empty equals absent), `rename_element` relink (plain
  wikilinks, bodies, schema reference fields via `updateReferenceString`; cell keys
  unaffected; cell values not relinked; origin unchanged), `rename_concept` rekey and
  relink, `remove_element` tombstones (fields, body, cells by row or col slug),
  `remove_matrix`, epoch reuse, non-applied ignored, `produce_artifact` is an artifact
  unit not a model unit.
- Compare serialized forms with `formatPropertyValue(parsePropertyValue(x))`.
- Tests in `core-tests/changelog/fold.test.ts`. Verification:
  `vitest run changelog` (core) + `npm run verify:fast`; regenerate mirrors and the
  console payload only if a mirrored export changes.
- The fold is additive: PR 10 (`checkProvenance`) and PR 11 (evidence index, legacy
  matching deleted) consume it. Do not wire it into tools yet.

Environment reminders (unchanged): no local bin shims, so run
`node ../../../node_modules/vitest/vitest.mjs run <filter>` from the package dir, run
typecheck with `node ../../../node_modules/typescript/bin/tsc`, push with
`--no-verify` and say so in the PR body, and never `npm ci`/`npm install` in the
worktree.

---

## PR 9 â€” S2a.1 (branch `lac/s2a1`, base `lac/s1b4`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 2a.1, 2a.2, 2a.9a.

- `core/changelog/fold.ts`: `foldChanges(changes)` folds the APPLIED changes, in
  canonical order, into `Map<UnitKey, FoldedUnit>` with `{key, kind, value, origin,
  setOrder}`. Rules are the A4 table: `add_element` (element alive + epoch cut, no
  units), `update_field` (field unit; `''` deletes), `update_element_text` (body),
  `update_concept_text` / `update_concept_field` (concept), `update_matrix_cell`
  (cell), `rename_element` (relink event), `rename_concept` (rekey + relink),
  `remove_element` (tombstones every unit under the element and every cell on its row
  or column), `remove_matrix` (tombstones its cells), `produce_artifact` (artifact
  unit), everything else no unit. No model file is read: O(C+U).
- `canonicalValue(raw)` is the serialized comparison form (parse through the shared
  property grammar, then re-serialize: typed numbers/booleans and `[a, b]` lists
  compare textually). An empty canonical value is absent.
- `core/changelog/units.ts`: `UnitState` (`{key, kind, value, origin, relinks}`) and
  `unitsFromFold(fold, model?)`; `applyRelinks` applies only the rename events
  recorded AFTER a unit's origin. Fields use `updateReferenceString` (bare and
  wikilink references), bodies/concepts use `updateWikiLinks`, cells and artifacts are
  never relinked.
- `core/changelog/index.ts`: the log now owns the fold. `tombstones` returns the
  removal changes, `units(model?)` the live state, `elementOrigin(key)` the change
  that created or removed an element. `history(unit)` and `origin(unit)` are cut at
  the latest `add_element` for the element (epoch), and `origin` is `undefined` when
  the unit is not live (a cleared field has no origin).
- `core/references.ts` (new): `updateReferenceString` / `updateWikiLinks` moved out of
  `mutate.ts` as pure string helpers (dependency: `slugify` only), so the
  browser-safe changelog can relink without pulling the mutation engine into the
  console payload. `mutate.ts` imports and re-exports them, so its public surface is
  unchanged.
- New tests: `core-tests/changelog/fold.test.ts` (15 cases, one per A4 row plus the
  epoch cut, artifacts and non-applied changes).
- Regenerated: `console/console-payload.generated.cjs` (+239 lines: the fold is part
  of the mirrored changelog; generated, excluded from the budget).
- Size: ~670 hand-authored changed lines (536+/134-), of which 202 are the new test
  file; generated +239. Declared over the 400-line budget (~2.7x the ~250 forecast).
- Verification: `vitest run` in nn-core, 200 files / 2,108 tests green; `vitest run`
  in nn-mcp, 53 files / 628 tests green; `tsc -p` (core build) clean;
  `build-core-mirrors` + its test green; `npm run verify:fast` fully green (202 steps).

### Deviations

22. `updateReferenceString` / `updateWikiLinks` moved from `mutate.ts` to a new
    `core/references.ts` (re-exported by `mutate.ts`). Keeping them in `mutate.ts`
    pulled the whole mutation engine into the mirrored console payload (+239 vs +~65
    generated lines) and made the changelog depend on it.
23. The design names `formatPropertyValue(parsePropertyValue(x))`; `formatPropertyValue`
    is private to the changeset serializer, so the fold owns `canonicalValue` with the
    same intent (parse then re-serialize). A single shared helper would need a
    serializer refactor that is not worth a slice on its own.
24. `origin(unit)` now returns `undefined` for a unit that is not live (cleared field,
    body or cell). S0 returned the last applying change regardless; that would claim
    an origin for a value that does not exist. No consumer relied on the old result.
25. Relink broadness: without a blueprint schema (the fold has none) a FIELD value
    whose whole text slugifies to the old element name is treated as a reference and
    rewritten, which is what `updateReferenceString` does by design. The mutation
    engine narrows this with `type:: reference`; the fold cannot. Drift (PR 10) sees
    the relinked value, so the only risk is a plain label equal to the renamed
    element's name.

---

## Handoff â€” start here next session (after PR 9)

Chain state: `lac/s2a1` is the tip (PR 9). Next branch:
`git switch lac/s2a1 && git switch -c lac/s2a2`.

**PR 10 â€” S2a.2 (drift check)** â€” tasks 2a.3 [RED], 2a.4 [GREEN], 2a.9b.

- Create `core/changelog/drift.ts` with `checkProvenance(log, models): ProvenanceReport`
  in fold mode. Diagnostics: `EDITED_WITHOUT_RECORD` (mismatch, or an expected value
  missing from the file), `UNIT_WITHOUT_RECORD` (unit in the file with no live entry;
  element with no frozen slug), `EVIDENCE_UNKNOWN`, `EVIDENCE_SOURCE_CHANGED` (sha
  mismatch skips anchor checks; anchor error only when the sha matches). Warnings by
  default, errors in strict mode. `slug::` and `knowledge_version` are not units; only
  documents inside a domaiNN; no changeset context yields no diagnostics.
- The log still needs `evidenceItems` / `evidenceSha256` filled by
  `changelog/load.ts` (`ChangeLike.evidence_sha256` is not carried yet) â€” add them in
  this PR, with the tests that need them.
- Compare through `canonicalValue` (fold) and the file's typed field values; typed
  numbers/booleans/lists, `''` clearing, hand edits, and whitespace-only edits (NOT
  fold drift) are in the task's test list.
- `log.units(model)` and `log.elementOrigin(key)` are the fold inputs; `units()` already
  applies renames recorded after each unit's origin.
- Tests in `core-tests/changelog/drift.test.ts`. Verification:
  `vitest run changelog` (core) + `npm run verify:fast`; regenerate the console
  payload mirror if the changelog exports change.

---

## PR 10 â€” S2a.2 (branch `lac/s2a2`, base `lac/s2a1`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 2a.3, 2a.4, 2a.9b.

- `core/changelog/drift.ts`: `checkProvenance(log, models, options)` in fold mode.
  It builds the file's unit map (element fields, prose bodies, concept text and
  fields, matrix cells) and compares it with `log.units(model)`:
  - mismatch, or a live value missing from the file â†’ `EDITED_WITHOUT_RECORD`
    (expected/actual named);
  - a file unit with no live entry â†’ `UNIT_WITHOUT_RECORD`;
  - a unit the log cleared (`to:: ''`) that reappears in the file â†’
    `EDITED_WITHOUT_RECORD` (expected absent); the absent case is no drift;
  - an element without an explicit frozen slug (`slugExplicit !== true`) â†’
    `UNIT_WITHOUT_RECORD`; an element the log created and the file lost (or the
    log removed and the file still has) â†’ `EDITED_WITHOUT_RECORD`.
  Values compare through `canonicalValue`, so typed numbers/booleans/lists and
  whitespace-only edits behave as specified. Severity is `warning` in fold mode and
  `error` with `strict: true`; `ok` is false only when an error exists.
- Evidence diagnostics over applied changes: `EVIDENCE_UNKNOWN` for missing or
  `unknown` evidence (names change, author, target) and `EVIDENCE_SOURCE_CHANGED`
  when a caller-supplied `sha256(path)` differs from the stamped
  `evidence_sha256` entry. Anchor resolution stays in the validator; drift only
  reports that the source moved.
- `core/changelog/load.ts`: fills `evidenceItems` (`splitEvidence`) and
  `evidenceSha256` from the parsed changeset, so drift (and later the evidence
  index) reads them without re-parsing.
- `core/changelog/index.ts`: exposes `cleared` and `elements` from the fold.
- `core/changelog/fold.ts`: tracks the `cleared` set (a re-added line is drift) and
  drops it on a new epoch.
- New tests: `core-tests/changelog/drift.test.ts` (14 cases: hand edit, unrecorded
  unit, rename relink, clear/re-add, typed values, whitespace, slug-less element,
  missing element, matrix cell, evidence unknown/sha changed, strict, no changeset
  context, untouched model).
- Regenerated: `console/console-payload.generated.cjs` (+44 lines, generated).
- Size: ~514 hand-authored changed lines (467+/47-), of which 205 are the new test
  file; generated +44. Declared over the 400-line budget (~2x the ~200 forecast).
- Verification: nn-core `vitest run` 201 files / 2,122 tests green; nn-mcp
  `vitest run` 53 files / 628 tests green; `tsc -p` (core) and `tsc --noEmit`
  (nn-mcp) clean; mirrors + their test green; `npm run verify:fast` fully green
  (202 steps).

### Deviations

26. The design signature is `checkProvenance(log, models)`. The sha/anchor side
    needs the current source bytes, so an optional third argument carries
    `{ strict?, sha256?(path) }`; with no resolver the `EVIDENCE_SOURCE_CHANGED`
    check is skipped, and anchor resolution remains the validator's job (S2b.2).
27. Only models the applied log touches are checked. Otherwise every model of a
    domain that gained changes later would report all of its units as
    `UNIT_WITHOUT_RECORD`.
28. "Element with no frozen slug" is read as `slugExplicit !== true`: the parser
    derives a slug from the heading even without a `slug::` line, and the spec's
    frozen-slug rule (freeze_slugs) is about the explicit, rename-stable slug.
29. `strict: true` only changes severity here; the strict replay engine
    (`replayMutations`, body comparison) is task 2b.1-2b.4 (PR 12), as designed.

---

## Handoff â€” start here next session (after PR 10)

Chain state: `lac/s2a2` is the tip (PR 10). Next branch:
`git switch lac/s2a2 && git switch -c lac/s2a3`.

**PR 11 â€” S2a.3 (evidence index, performance guard, legacy matching deleted)**
tasks 2a.5 [RED], 2a.6 [GREEN], 2a.7 [RED], 2a.8 [GREEN/REFACTOR], 2a.9c.
- Add `evidence(scope: 'live' | 'all-time'): ReadonlyMap<string, EvidenceSite[]>` to
  `ChangeLog`: `'live'` uses the last applied change per unit after the epoch cut,
  `'all-time'` every applied change; a removed unit leaves no live edge but stays
  all-time. `EvidenceSite` carries the change (id, unit, evidence items, sha list).
  The loader already fills `evidenceItems` / `evidenceSha256` (PR 10).
- Performance guard: fold over the largest corpus (benchmark fixture) completes under
  a documented budget, and the changelog stays browser-safe (no Node imports in
  `index.ts`; only `node.ts` touches the filesystem).
- Delete `core/console/provenance.ts`; keep `core/console/element-history.ts` working
  through the log; reduce `core/changeset/history.ts` (`checkStaleTarget`) to a call
  into the log; delete `normalizeAddressKey`; update imports. Move the remaining
  `history.test.ts` cases onto the log.
- Touches the console payload and console history: regenerate
  `console/console-payload.generated.cjs`, and run the console golden suites plus
  `npm --workspace=@cognnitive/nn-core test -- changelog changeset console` (run
  vitest directly) and `npm run verify:fast`.

---

## PR 11 â€” S2a.3 (branch `lac/s2a3`, base `lac/s2a2`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 2a.5, 2a.6, 2a.7, 2a.8, 2a.9c.

- `core/changelog/index.ts`: `evidence(scope: 'live' | 'all-time')` returns a
  `ReadonlyMap<string, EvidenceSite[]>` keyed by **citation** (path plus anchor,
  exactly as the change carries it). `EvidenceSite` is `{changeId, unit, evidence,
  sha256}`; a list evidence change is indexed under every item with its positional
  sha list. `'live'` is the origin of every live unit (after the epoch cut) plus the
  creation change of every live element; `'all-time'` is every applied change. A
  removed unit has no origin, so its last edge never stays live, and a removed
  element drops its creation edge. `tombstones` keeps returning the removal changes
  (already real since S2a.1).
- `core/console/provenance.ts` **deleted** (144 source lines). `deriveValueHistory` /
  `deriveFieldOrigin` moved to `core/console/element-history.ts` (same behaviour, now
  with the log's types); `console/index.ts` no longer exports the deleted barrel.
  `detectUnrecordedEdits` is gone: `checkProvenance` (S2a.2) owns drift, and the
  console export no longer re-implements matching (a comment marks the seam).
- `core/changeset/history.ts`: `checkStaleTarget` keeps its signature (`changesDir`,
  `modelSlug`, `elementSlug`, `baseVersion`, `maxScan = 50`) but scans the newest
  `maxScan` changesets into a `buildChangeLogFromChangesets` log and asks it for the
  element lifecycle (`add_element` / `remove_element`), then applies the same version
  gate as before (`base_version >= base` or `result_version > base`). The local
  reverse scan and `matchesElement` are gone. `normalizeAddressKey` was already
  absent (removed in S0a) â€” nothing left to delete.
- New tests: `core-tests/changelog/evidence.test.ts` (8: supersession, removed unit,
  list evidence + sha list, live element creation evidence, epoch reuse, non-applied
  ignored, artifact unit) and `core-tests/changelog/performance.test.ts` (2: a
  12,000-change / 600-element corpus folds, enumerates units and builds both evidence
  scopes under a documented 4,000 ms budget; only `node.ts` imports Node built-ins).
  `tests/console/provenance.test.ts` deleted (its `history`/`origin` cases were already
  encoded in `tests/changelog/log.test.ts`); two new log cases cover the element
  lifecycle and a cleared unit having no origin.
- Regenerated: `console/console-payload.generated.cjs` (generated, excluded from the
  budget). The testlab fixture and console bundle were not touched: no console
  blueprint file changed.
- Size: 546 added / 460 deleted hand-authored (incl. ~240 lines of new tests and 254
  deleted source/test lines), plus the generated payload mirror. Declared over the
  400-line budget (~2.3x the ~200 forecast): the evidence-index contract, the
  performance/browser guard and the deletion of the legacy reader share one slice.
- Verification: nn-core `vitest run` 202 files / 2,123 tests green; nn-mcp `vitest run`
  53 files / 628 tests green; `tsc -p` (core) and `tsc --noEmit` (nn-mcp) clean;
  `build-core-mirrors` + its test green; all 40 `test/console-*.test.mjs` suites green;
  `npm run verify:fast` fully green (202 steps).

### Deviations

30. The evidence index is **keyed by citation**, not by unit: the spec says "for each
    cited path (and anchor) it MUST list the changes citing it", and gc/impact check
    the sources side. `resolve_sources` (S2b.3) will query by unit instead, through
    `site.unit`.
31. `'live'` also carries the creation change of a live element, although an element is
    not a fold unit: without it an element whose fields were never updated would lose
    the evidence that created it, and the graph's `origin: "source"` edge (S2b.3) is
    built from live evidence.
32. There is no benchmark fixture in the repository (the largest domain has 5 applied
    changesets), so the performance guard builds a synthetic 12,000-change corpus in
    the test and documents a 4,000 ms budget. It catches accidental quadratic
    behaviour, not milliseconds.
33. The console export no longer prints its transitional `EDITED_WITHOUT_RECORD`
    fingerprint on stderr. The capability moved to `checkProvenance` (S2a.2) and is
    wired into `validate_knowledge` / `check_domain` in S2b.2; re-implementing it in a
    static exporter would duplicate the matching A1 centralizes.
34. `checkStaleTarget` keeps a version gate that needs the changeset frontmatter, so it
    reads `models` per changeset while the log decides **which** change matters. The
    log carries no version transitions by design; adding them to `LoggedChange` would
    leak apply-time facts into the browser-safe log.

---

## Handoff â€” start here next session (after PR 11)

Chain state: `lac/s2a3` is the tip (PR 11). Next branch:
`git switch lac/s2a3 && git switch -c lac/s2b1`.

**PR 12 â€” S2b.1 (strict replay)** â€” tasks 2b.1 [RED], 2b.2 [GREEN], 2b.3 [RED],
2b.4 [GREEN], 2b.5 [RED/P], 2b.12a.

- `core/mutate.ts`: add `replayMutations(model, ops, schema)`. Clone ONCE and run
  every op on one draft (a spy asserts the clone count is 1); the result equals
  sequential `applyMutation` output.
- `mcp/tools/provenance-strict.ts`: rebuild the `add_model` skeleton through
  blueprint resolution, replay through `replayMutations`, compare `serializeModel`
  BODIES only (frontmatter excluded); `check_domain {strict: true}` returns the
  report with `mode: 'strict'` and severity `error`. A whitespace-only edit is
  strict drift and not fold drift.
- `mcp-tests/provenance-differential.test.ts`: seeded random op sequences; fold and
  strict agree when there is no drift, and both flag a mutated file.
- Verification: `vitest run provenance` (nn-mcp) + `vitest run replay-mutations`
  (nn-core) + `npm run verify:fast`; rebuild core dist (`tsc -p`) before
  typechecking nn-mcp.

**Then:** PR 13 (S2b.2) wires `checkProvenance` into `check_domain {provenance}` and
`validate_knowledge` (keep the old `lineage` field until S4b); PR 14 (S2b.3) is
`resolve_sources` with an optional `target`, console cell origin and the G13 graph
edges; PR 15 (S3a.1) rewrites `projectLineage` as a projection.

Environment reminders (unchanged): no local bin shims, so run
`node ../../../node_modules/vitest/vitest.mjs run <filter>` from the package dir, run
typecheck with `node ../../../node_modules/typescript/bin/tsc`, push with
`--no-verify` and say so in the PR body, and never `npm ci`/`npm install` in the
worktree.

---

## PR 12 â€” S2b.1 (branch `lac/s2b1`, base `lac/s2a3`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 2b.1, 2b.2, 2b.3, 2b.4, 2b.5, 2b.12a.

- `core/mutate.ts`: `replayMutations(model, ops, schema)` clones ONCE and runs every
  op through `runMutation` on the same draft; returns `{success, model, results}` and
  never mutates the input. A failing op does not stop the replay (the results array
  says which one diverged). `ReplayOperation` / `ReplayResult` exported from
  `core/index.ts`.
- `mcp/tools/change-args.ts` (new): `parseTargetAddress`, `findElementInModel` and
  `mutationArgsForChange` moved out of `apply-change.ts`. The apply engine and the
  strict replay now share ONE change â†’ mutation-arguments mapping, so they cannot
  drift (the A3 concern). `apply-change.ts` imports the three and lost ~150 local
  lines.
- `mcp/tools/provenance-strict.ts` (new): `checkDomainProvenance(rootDir, {strict})`.
  Fold mode delegates to `checkProvenance`. Strict mode:
  - finds the applied `add_model` of each level-3 model (bridging the caller's id to
    the created canonical id through the changeset's `models` map),
  - rebuilds the skeleton with `scaffoldKnowledgeDocument` after resolving the
    blueprint (`resolveBlueprintWithCache` + `resolveBlueprintSchema`),
  - replays every applied change of that model (minus `add_model`, `bump_version`,
    `comment`, `produce_artifact`) through `replayMutations`,
  - compares the **file's raw body** (frontmatter excluded) with the replay's
    serialized body: a whitespace-only edit is strict drift and not fold drift.
    Evidence diagnostics (`EVIDENCE_UNKNOWN`, `EVIDENCE_SOURCE_CHANGED`) are kept;
    unit-level fold drift is replaced by the replay verdict. Severity is `error`.
- `mcp/tools/check-workspace.ts`: `CheckWorkspaceOptions.strict` and a `provenance:
  ProvenanceReport` field on the report. `mcp/server.ts`: `check_domain` accepts
  `strict` (documented in the tool schema).
- `core/changelog`: `LoggedChange.resolvedSlug` (the `resolved_slug` annotation), so the
  replay addresses the frozen slug the apply stamped. `core/index.ts` also exports
  `canonicalUnitModelId`.
- New tests: `core-tests/changeset/replay-mutations.test.ts` (3: equality with
  sequential apply, exactly one `structuredClone` call, input untouched + failing op
  reported) and `mcp/test/provenance-{strict,differential}.test.ts` (4 + 6:
  no drift, one-byte edit, whitespace-only strict-vs-fold, frontmatter excluded; and
  seeded op sequences over three seeds agreeing and both flagging a hand edit).
- Regenerated: `console/console-payload.generated.cjs` and the two
  `nn-core.generated.cjs` mirrors (generated, excluded from the budget).
- Size: ~940 hand-authored changed lines (â‰ˆ640 added source, â‰ˆ330 added tests, â‰ˆ150
  removed from apply-change by the extraction). Declared over the 400-line budget
  (~3.8x the ~250 forecast); not re-sliced.
- Verification: nn-core `vitest run` 203 files / 2,126 tests green; nn-mcp `vitest run`
  55 files / 638 tests green; `tsc -p` (core) and `tsc --noEmit` (nn-mcp) clean;
  mirrors + their test green; `npm run verify:fast` fully green (202 steps).

### Deviations

35. Strict compares the FILE's raw body, not `serializeKnowledge(file)`: comparing two
    serializations normalizes formatting away, so the "whitespace-only edit is
    strict-only drift" scenario could never fire. Consequence: a model written by an
    older serializer can report strict drift until it is rewritten. That is the
    meaning of strict, and fold mode remains the default.
36. The change â†’ mutation-arguments mapping was extracted to `change-args.ts` instead
    of being duplicated in the strict engine. Same code path in apply and replay; the
    extraction is why `apply-change.ts` shrank.
37. `add_model` keeps the caller's id in `target` while the created file carries the
    canonical id (`<id>_<blueprint>`), so strict bridges the two through the
    changeset's `models` map. A model whose `add_model` is not in the log (or whose
    blueprint no longer resolves) cannot be rebuilt: strict reports nothing for it
    rather than inventing diagnostics. `collectProvenanceModels` strips the `_NN`
    suffix `listKnowledge` keeps in ids.
38. `check_domain` now always returns `provenance` (fold by default). The flat
    `evidence` list is still emitted; `check_domain.provenance` replaces it in PR 13
    (task 2b.7), which also adds the `validate_knowledge` drift path and the
    LC_programas-like fixture.

---

## Handoff â€” start here next session (after PR 12)

Chain state: `lac/s2b1` is the tip (PR 12). Next branch:
`git switch lac/s2b1 && git switch -c lac/s2b2`.

**PR 13 â€” S2b.2 (`check_domain.provenance` and `validate_knowledge` drift)** â€” tasks
2b.6 [RED], 2b.7 [GREEN], 2b.12b.

- `check_domain` already returns `provenance` from PR 12: task 2b.6's contract test must
  assert it (and that `lineage` is still present until S4b). Task 2b.7 becomes: drop the
  flat `evidence` list from the report (the report's `provenance.diagnostics` carries
  the same `EVIDENCE_UNKNOWN` entries), and wire drift into `validate_knowledge` when a
  workspace root is available (no root â†’ no drift, no error).
- Build the LC_programas-like fixture (130 applied changes with `unknown` evidence while
  units cite sidecars) and assert 130 `EVIDENCE_UNKNOWN` plus drift.
- Verification: `vitest run check-workspace validate` (nn-mcp) + `npm run verify:fast`.

**Then:** PR 14 (S2b.3) is `resolve_sources` with an optional `target`, console cell
origin and G13 graph edges; PR 15 (S3a.1) rewrites `projectLineage` as a projection.

Environment reminders (unchanged): no local bin shims, so run
`node ../../../node_modules/vitest/vitest.mjs run <filter>` from the package dir, run
typecheck with `node ../../../node_modules/typescript/bin/tsc`, push with
`--no-verify` and say so in the PR body, and never `npm ci`/`npm install` in the
worktree. Core dist must be rebuilt (`tsc -p` in `nn-core`) before typechecking
nn-mcp whenever a core type or export changes.

---

## PR 13 â€” S2b.2 (branch `lac/s2b2`, base `lac/s2b1`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

Tasks: 2b.6, 2b.7, 2b.12b.

- `mcp/tools/provenance-models.ts` (new): `collectProvenanceModels` moved out of
  `provenance-strict.ts`, so `validate.ts` can build the fold report without importing
  the strict engine (and its blueprint resolver). `provenance-strict.ts` re-exports it.
- `mcp/tools/validate.ts`: `collectDriftDiagnostics(rootDir)` builds the fold report
  (`buildChangeLog(readLineageSnapshot(root))` + `checkProvenance`) and files each
  diagnostic against the model path its unit belongs to. `runWorkspaceValidation`
  appends the drift filtered for the model, so `validate_knowledge` (workspace mode)
  reports `EDITED_WITHOUT_RECORD` / `UNIT_WITHOUT_RECORD` / evidence drift and a
  document validated without a workspace root reports none.
- `mcp/tools/check-workspace.ts`: the flat `evidence` list is gone from the report;
  `provenance.diagnostics` carries the same `EVIDENCE_UNKNOWN` entries (S0c's
  transitional list is retired, as task 0.9 announced). The `lineage` field stays
  until S4b.
- New tests: `mcp/test/provenance-contracts.test.ts` (5: report carries `provenance`
  and no flat `evidence`, keeps `lineage`; drift after a hand edit; **130** applied
  changes with `unknown` evidence yield exactly 130 `EVIDENCE_UNKNOWN`; workspace
  validate reports drift; isolated validate does not).
- Size: ~150 added lines of source + ~230 lines of tests (one new fixture, one moved
  module). Inside the 400-line budget (~380 hand-authored).
- Verification: nn-mcp `vitest run` 56 files / 643 tests green; `tsc --noEmit` clean;
  nn-core unchanged (203 files / 2,126 tests green on the base); `npm run verify:fast`
  fully green (202 steps).

### Deviations

39. Workspace-mode `validate_knowledge` decorates diagnostics as `{path, message,
    severity, filePath}` and DROPS `code` (pre-existing). Passing `code` through made two
    pre-existing `KU_DANGLING_FILE` errors in `validate-workspace-sources.test.ts`
    visible (the assertions only ever matched by code, so they were passing vacuously).
    Fixing that is a separate change: this PR leaves the decoration as it was and the
    drift test matches the bracketed code in the message. Filed here so it is not
    silently lost: **workspace diagnostics should carry their code**.
40. The LC_programas-like fixture is built in the test (130 applied `update_field`
    changes with `evidence:: unknown` over one model) rather than shipped as a corpus
    directory: the scenario is the count and the visibility, and the corpus rebuild is
    S5b.4's job.

---

## Handoff â€” start here next session (after PR 13)

Chain state: `lac/s2b2` is the tip (PR 13). Next branch:
`git switch lac/s2b2 && git switch -c lac/s2b3`.

**PR 14 â€” S2b.3 (`resolve_sources` and graph edges from live evidence)** â€” tasks
2b.8 [RED], 2b.9 [GREEN], 2b.10 [RED], 2b.11 [GREEN], 2b.12c.

- `resolve_sources`: optional `target` address (cells, bodies); returns
  `ResolvedCitation[]` of the ORIGIN change's evidence items, each with `changeId`;
  follows the last change (`log.origin(target)`), so superseded evidence never wins.
- `core/console/payload-builder.ts`: cell origin (each non-empty matrix cell carries
  `history` and `origin`).
- Graph: `origin: "source"` edges and `node.sources` built from `log.evidence('live')`
  in `core/recursiveParser/normalize.ts` (G13); superseded evidence has no edge.
- Verification: `vitest run resolve-sources` (nn-mcp), `vitest run recursiveParser
  console` (nn-core), `npm run verify:fast`; rebuild core dist before typechecking
  nn-mcp; regenerate the console payload mirror.

**Then:** PR 15 (S3a.1) is `isRegenerableView` + the `projectLineage` projection.

Environment reminders (unchanged): no local bin shims, so run
`node ../../../node_modules/vitest/vitest.mjs run <filter>` from the package dir, run
typecheck with `node ../../../node_modules/typescript/bin/tsc`, push with
`--no-verify` and say so in the PR body, and never `npm ci`/`npm install` in the
worktree.

---

