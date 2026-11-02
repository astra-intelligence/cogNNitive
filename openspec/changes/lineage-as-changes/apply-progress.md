# Apply progress: lineage-as-changes

Appended per PR. Newest entries at the end. Nothing in this file replaces a
previous entry.

---

## PR 1-3 — S0a / S0b / S0c (branch chain `lac/s0a` → `lac/s0b` → `lac/s0c`)

Applied: 2026-11-02. Status: implemented, green, pushed; PRs opened against the chain.

### Slice decision (deviation, maintainer-approved)

S0 was planned as one PR of ~300 changed lines. Measured after implementation it
was ~1,376 hand-authored lines (1,417+/582- excluding the generated console
mirror), 3.4x the budget, so it was stopped and reported. The maintainer chose to
split it into three chained sub-PRs. `tasks.md` now carries S0a/S0b/S0c and the
chain is renumbered 1..32 (every later PR moved by +2).

### S0a — `changelog/` module and console rewire (PR 1, `lac/s0a`)

Tasks: 0.1, 0.2, 0.3, 0.4, 0.5.

- New `core/changelog/{order,load,index,node}.ts`: `compareChanges` (applied_at →
  filename UTC stamp → filename → document index), `buildChangeLog(files)` plus
  `buildChangeLogFromChangesets(records)` for the console transport,
  `createChangeLog`, `history(unit)`, `origin(unit)`, `tombstones` (empty stub
  until S2a), `unitOf` (`resolved_target` when stamped, else `target`).
- `naming/contract.ts` gains `changesetStampOf(nameOrPath)` so the changeset stamp
  has ONE definition (the NN Name Regex Guard rejected the local regexes).
- Console: `provenance.ts` (`deriveValueHistory`, `deriveFieldOrigin`,
  `detectUnrecordedEdits` over the log), `element-history.ts` (applied-only
  per-field `provenance`, every-status element history, exact element-part
  matching — `a-b` never matches `ab`), `payload-builder.ts` (element
  `provenance` type), `console/index.ts` (exports the log builder for the
  payload mirror), `scripts/export-console.mjs` (builds the log for the drift
  warning).
- Files touched: the above plus `core/index.ts`, `core/browser.ts`, tests
  (`tests/changelog/{order,log}.test.ts`, `tests/console/provenance.test.ts`,
  `tests/console-element-history.test.ts`) and the regenerated
  `console-payload.generated.cjs`, `naming-contract.generated.cjs`,
  `nn-core.generated.cjs` (generated, excluded from the budget).
- Size: 1,204+/447- total, of which 623 lines are the three generated mirrors →
  ~1,028 hand-authored (~390 of them tests). Declared in `tasks.md` and in the PR
  body.
- Verification: `vitest run tests/changelog tests/console
  tests/console-element-history tests/mutate` → 43 files / 327 tests green;
  `tsc --noEmit` (core) clean; `npm run verify:fast` green on the tip.

### S0b — `sources` out of the change model (PR 2, `lac/s0b`)

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

### S0c — `EVIDENCE_UNKNOWN` (PR 3, `lac/s0c`)

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
   `node_modules`, `@cognnitive/*` → this worktree's packages, `skills/nn-sources/
   node_modules`) and run `vitest`/`tsc`/`tsup` through their package entry files.
   `npm run verify:fast` works because it invokes node scripts and
   `node_modules/typescript/bin/tsc` directly. `npm --workspace=… test` and the
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

## PR 4 — S1a (branch `lac/s1a`, base `lac/s0c`)

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
- `iNNfo/specs/bluepriNNts/changes/spec_NN.md`: `blueprint_version` `V_0-5-5` →
  `V_0-6-0`; op select gains `update_element_text` and `produce_artifact`;
  `fields` field removed; `seed` / `resolved_target` / `evidence_sha256` /
  `applied_at` / `batch` declared; prose updated (ops, seed, evidence list,
  execution facts); template repinned to `V_0-6-0`. `evidence` stays `citation`.
- Regenerated: `bluepriNNts/catalog.json`, `core/schema/canonical-registry.ts`,
  `console-payload.generated.cjs` (generated, excluded from the budget).
- Size: ~542 total, of which ~91 are generated → ~451 hand-authored (declared
  over 400; the forecast was ~350).
- Verification: `vitest run tests/changeset` → 16 files / 100 tests green;
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

## PR 5 — S1b.1 (branch `lac/s1b1`, base `lac/s1a`)

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

## PR 6 — S1b.2 (branch `lac/s1b2`, base `lac/s1b1`)

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

## Handoff — start here next session

Chain state: `lac/s1b2` is the tip (PR 6, #448). Next branch: `git switch -c lac/s1b3` from `lac/s1b2`.

**PR 7 — S1b.3 (emitters stop sending `fields`)**

Known locations from the survey done at the end of this session:

- `skills/nn-sources/scripts/lib/convergence-delta.js` → `buildApplyPlan` (around
  line 280): emits `add_element` with `fields` + `evidence`. Change it to emit
  `add_element` (op/target/concept/name only) followed by one `update_field`
  (`target: model@slug&field`, `to`, `evidence`, **no `from`**) per field, and
  `add_matrix` with `seed: {columns, rows}` instead of `fields.columns/rows`.
  Its tests are `scripts/lib/convergence-delta.test.js` and
  `scripts/lib/convergence-cli.test.js` (both assert the exact plan today).
- Console emitters: the draft → changeset mapping lives in
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
precondition, `USE_UPDATE_ELEMENT_TEXT` on `update_field …&description`), stops
`add_element` copying `notes` into the prose, and rejects `fields` at proposal and
apply. After that the fold engine (S2a.1) starts, which is where the change
becomes real.

Note on `tasks.md`: task 1b.13's mirror/gate steps are per PR; the console bundle
and payload mirror must be regenerated whenever `console/` changes.

---

## PR 7 — S1b.3 (branch `lac/s1b3`, base `lac/s1b2`)

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

## PR 8 — S1b.4 (branch `lac/s1b4`, base `lac/s1b3`)

Applied: 2026-11-02. Status: implemented, green, pushed; PR opened.

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
  (bare element target, `to` required) is validated; `update_field …&description` is
  rejected with `USE_UPDATE_ELEMENT_TEXT`. `normalizeOperations` no longer accepts
  `fields`.
- `mcp/tools/apply-change.ts`: pre-flight `rejected` for any change carrying `fields`
  (`INVALID_OPERATION`) and for `update_field …&description`
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

