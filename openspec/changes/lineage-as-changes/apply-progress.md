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


