# Tasks: Lineage as Changes

Change: `lineage-as-changes`. Mode: Strict TDD (every behavior task is `[RED]` failing test, then `[GREEN]` implementation, then `[REFACTOR]` where useful). Artifact store: openspec. Delivery: `ask-on-risk`. Chain strategy: `feature-branch-chain` (PROPOSED, pending maintainer confirmation).

## Conventions

- **Paths.** `core/` = `iNNfo/packages/nn-core/src/`, `core-tests/` = `iNNfo/packages/nn-core/tests/`, `mcp/` = `iNNfo/packages/nn-mcp/src/`, `mcp-tests/` = `iNNfo/packages/nn-mcp/tests/`, `sources/` = `skills/nn-sources/`. Relative imports in nn-core MUST carry `.js`.
- **Spec links.** `(cp)` change-provenance, `(clv)` computed-lineage-view, `(apc)` artifact-production-change, `(cdm)` changeset-document-model, `(cae)` changeset-apply-engine, `(rm)` removal deltas, `(ban)` citation/sources ban specs (provenance-vocabulary, document-citations, typed-source-references, source-list-grammar, citation-parser-resolver, source-sidecar, cognitivize-in-place), `(fcp)` field-citation-provenance / console-field-citations / console-payload-builder, `(woa)` write-once-artifacts, `(ewr)` external-watch-roots, `(wep)` workspace-executions-provenance.
- **Markers.** `[P]` can run in parallel with its sibling tasks of the same slice (disjoint files). `[S]` sequential: depends on the previous task. Slices themselves are sequential (S0 -> S1a -> S1b -> S2a -> S2b -> S3a -> S3b -> S4 -> S5a -> S5b -> S6 -> S7), except where a slice header says otherwise.
- **Safety rules for every writer.** Never run `npm ci` or `npm install` in the worktree (`node_modules` are junctions into the primary checkout; it corrupts the primary). Builds and tests only. Run preflight fixtures with an empty `HOME` and `USERPROFILE`. Commit to the session worktree with explicit paths and conventional commits, no AI attribution. One work-unit commit per `[RED]+[GREEN]` pair.
- **Mirrors.** Any change under `core/` that is mirrored to CJS requires `node scripts/build-core-mirrors.mjs` and a committed regenerated `*.generated.cjs`; verify with `node --test scripts/build-core-mirrors.test.mjs`.
- **Standard slice gate** (run before opening each PR): `npm --workspace=@cognnitive/nn-core test`, `npm --workspace=@cognnitive/nn-mcp test`, `npm --prefix skills/nn-sources test` (when `sources/` or mirrors changed), `node scripts/verify.js`. Slice-specific commands are listed in each slice.
- **PR structure (chained-pr skill).** Tracker branch `feat/lineage-as-changes` (draft, no-merge). PR for S0 targets the tracker; each later PR targets the previous slice branch. Every PR body states start, end, prior dependency, follow-up and out-of-scope, with a dependency diagram marking the current PR. Only the tracker merges to `main`, with a **merge commit**.

---

## S0 - Fixes for the predecessor's gaps (PR 1, ~300 LOC)

Start: `dev` as is. Finish: one `changelog/` module exists with the shared comparator and applied-only reads, the console reads origin from changes, `sources` is no longer advertised or written. Rollback: revert the PR; nothing persisted changes.

- [ ] 0.1 [RED] [S] Comparator tests in `core-tests/changelog/order.test.ts`: tie-break order `(applied_at, filename UTC stamp, filename, document index)`, stamp regexp `/_(\d{8}T\d{6}Z)_changes_NN\.md$/`, totality (distinct changes never equal). (cp: One shared deterministic comparator)
- [ ] 0.2 [GREEN] [S] Create `core/changelog/{order,load,index}.ts` and `core/changelog/node.ts` (`loadChangeLog(rootDir) = buildChangeLog(readWorkspaceSnapshot(rootDir))`): `compareChanges`, `buildChangeLog(files)` exposing `all`, `history(unit)` (applied-only), `origin(unit)`, `tombstones` stub. Export from `core/index.ts`. (cp)
- [ ] 0.3 [RED] [S] Tests in `core-tests/console/provenance.test.ts` and `element-history` tests: a `conflict`/`rejected` change is excluded from history and origin; a conflicted sibling inside a `partially_applied` changeset is excluded; the review list still shows every status; keys are model-scoped (`m1@x` vs `m2@x`); per-field origin is wired into the payload. (cp: Provenance reads applied changes only; fcp)
- [ ] 0.4 [GREEN] [S] Rewire `core/console/{provenance,element-history,payload-builder}.ts` to `buildChangeLog` (applied filter, comparator, model-scoped keys, per-field origin from `deriveFieldOrigin`). (fcp)
- [ ] 0.5 [REFACTOR] [S] Remove the duplicated sort and key-normalizing code from the three console files now covered by `changelog/`.
- [ ] 0.6 [RED] [P] Tests: `propose_changeset` rejects a `sources` key loudly; `evidence` is a recognised string key in `server.ts` input and in `STRING_KEYS`; `convergence-delta.js` output carries `evidence`, never `sources`; `rewriteFieldCitation` and the `add_element` `sources` mapping no longer exist. Files: `mcp-tests/propose-changeset*.test.ts`, `core-tests/changeset/mutate*.test.ts`, `sources/test/convergence-delta*.test.js`. (cdm; ban)
- [ ] 0.7 [GREEN] [S] Delete `rewriteFieldCitation` and the `sources` mapping in `core/mutate.ts`; add `evidence` to `STRING_KEYS` and `server.ts`; reject `sources` in `mcp/tools/propose-changeset.ts`; `sources/convergence-delta.js` emits `evidence`.
- [ ] 0.8 [RED] [P] Test in `mcp-tests/validate*.test.ts`: an applied change with `unknown` or missing evidence (including a synthesized direct op) is applied and yields the warning `EVIDENCE_UNKNOWN` naming change, author and target; 130 unknown changes yield 130 warnings. (cp: `unknown` evidence is a warning)
- [ ] 0.9 [GREEN] [S] Implement `EVIDENCE_UNKNOWN` in `mcp/tools/validate.ts` (and the `check_domain` surface as a flat list until S2b renames it into `provenance`).
- [ ] 0.10 [S] Regenerate mirrors (`node scripts/build-core-mirrors.mjs`), run the standard slice gate. Open PR 1.

Verification: `npm --workspace=@cognnitive/nn-core test -- changelog console changeset` then the standard gate.

---

## S1a - Change model: list evidence and execution facts in the parser/serializer (PR 2, ~350 LOC)

Start: S0 merged on the tracker. Finish: parser, serializer and hasher understand list evidence and the new keys; the `changes` bluepriNNt is bumped. Rollback: revert; no apply behavior changed yet.

- [ ] 1a.1 [RED] [S] `core-tests/changeset/evidence.test.ts`: `splitEvidence` via `splitSourceFieldValue`; `[A, B]` list grammar; `decision` and `unknown` valid only alone (mixed list is a loud error); serialized string stays the sealed value; single-item form still parses. (cdm: list evidence; ban: source-list-grammar)
- [ ] 1a.2 [GREEN] [S] Create `core/changeset/evidence.ts`.
- [ ] 1a.3 [RED] [S] Tests in `hasher.test.ts`, `serializer.test.ts`, `parser.test.ts`: `EXECUTION_FACT_KEYS` (`resolved_slug`, `resolved_target`, `evidence_sha256`) is the single exported list; the serializer and `normativeChangeLines` use it; the facts are excluded from `PROPOSAL_KEYS` so `verifyProposalSha` is unchanged after stamping; `seed` is sealed and `fields` is not in `PROPOSAL_KEYS`; annotation round trip of `resolved_target::` and `evidence_sha256::` (positional `[a, b]`). (cdm: sealing, execution facts)
- [ ] 1a.4 [GREEN] [S] Update `core/changeset/{types,parser,serializer,hasher}.ts`: export `EXECUTION_FACT_KEYS`, remove the duplicated annotation-key regexes (`apply-change.ts:241`, `changeset/serializer.ts:5`) in favor of it, add `seed` to the sealed keys, drop `fields`.
- [ ] 1a.5 [RED] [S] Blueprint test in `core-tests/changeset/template.test.ts`: the `changes` blueprint validates a changeset with ops `update_element_text` and `produce_artifact`, has `seed`, `resolved_target`, `evidence_sha256`, `applied_at`, `batch`, has no `fields`, and `evidence` stays `citation`. (cdm; apc: The op is valid in the blueprint)
- [ ] 1a.6 [GREEN] [S] Edit `iNNfo/specs/bluepriNNts/changes/spec_NN.md`: bump `template_version` (and `spec_version` as the two axes require; see `manifest/source.yaml` `version:` = `spec_version`), then register the new `template_version` in the editor's `SHIPPED_TEMPLATE_VERSIONS` and run `npm run sync:versions`. Do NOT touch any published `_V_` file.
- [ ] 1a.7 [S] Standard gate plus `node scripts/verify.js` (template inventory guard and `template_version` guard). Open PR 2.

Verification: `npm --workspace=@cognnitive/nn-core test -- changeset`, `npm run sync:versions` leaves a clean diff, `node scripts/verify.js`.

---

## S1b - Apply engine: stamping, new ops, field-less add_element (PR 3, ~550 LOC; over budget, see forecast)

Start: S1a merged. Finish: `apply_change` stamps `resolved_target`, `evidence_sha256`, clamps `applied_at`, supports `update_element_text`, `produce_artifact` and `seed`, and emitters no longer send `fields`. Rollback: revert; blueprint bump from S1a stays inert.

- [ ] 1b.1 [RED] [S] `core-tests/changeset/resolved-target.test.ts` (unit address builder): field `model@slug&field`, body `model@slug&#body`, cell `model@matrix-slug&row-slug&col-slug` (axis = frozen slug of the element named by the label else `slugify(label)`; matrix = `slugify(name)`), concept `model@concept:<Name>[&field]`, artifact = POSIX path; model id has no version token; rename-stable (history survives `Alpha` renamed to `Beta`); `a-b` vs `ab` do not collide; two models do not collide. (cp: Frozen-slug target identity)
- [ ] 1b.2 [GREEN] [S] Implement the address builder next to `core/changeset/` (reuse `unitAddress`) and stamp it in `mcp/tools/apply-change.ts`.
- [ ] 1b.3 [RED] [S] `mcp-tests/apply-change-facts.test.ts`: stamping on applied changes only (conflict/rejected carry neither fact); `evidence_sha256` is the sha256 of the cited file, one per item in order, omitted for `decision`/`unknown`; `verifyProposalSha` still true after write-back; a proposal pre-carrying `resolved_target:: other@x&y` is overwritten; `applied_at` clamped to `max(now, latest+1ms)` under the lock; applied changes in one batch share `applied_at`. (cae: Execution facts; cp: pinned by `evidence_sha256`, comparator clamp)
- [ ] 1b.4 [GREEN] [S] Implement stamping, clamp and `EXECUTION_FACT_KEYS` use in `mcp/tools/apply-change.ts`; keep the lock semantics.
- [ ] 1b.5 [RED] [P] `core-tests/changeset/update-element-text.test.ts` and mutate tests: `update_element_text` writes `ElementNode.description` with a `from` precondition (`PRECONDITION_FAILED` on mismatch); no `description::` line written; `update_field` on `description` rejected with `USE_UPDATE_ELEMENT_TEXT`; `add_element` no longer copies `notes` into the prose; `add_element` with `fields` rejected with `INVALID_OPERATION` pointing to `update_field` at proposal and defensively at apply (changeset persisted `rejected`). (cdm; cp: Prose body)
- [ ] 1b.6 [GREEN] [S] `core/mutate.ts`: `updateElementText`, `addElement` without fields, `USE_UPDATE_ELEMENT_TEXT`; `changeset/conflicts.ts`: precondition for prose; `propose-changeset.ts` and `server.ts`: new op, reject `fields`.
- [ ] 1b.7 [RED] [P] `add_matrix` `seed: {columns, rows}`: creates headers and empty cells, no cell units recorded, `seed` sealed, `seed` on any other op rejected. (cdm: Matrix seed)
- [ ] 1b.8 [GREEN] [S] Implement `seed` in `core/mutate.ts` `addMatrix` and the parser/serializer round trip.
- [ ] 1b.9 [RED] [P] `mcp-tests/produce-artifact.test.ts`: path-target branch (no model load, no `knowledge_version` bump, empty `models` map); target must be a safe, existing workspace path that is not a model, changeset or sidecar (`ARTIFACT_NOT_FOUND` leaves the changeset `proposed`; unsafe path rejected); evidence resolved at intake (`CITATION_UNRESOLVED`); second applied record for the same path is `status:: conflict` `ARTIFACT_ALREADY_RECORDED`; `resolved_target` = artifact path; `author` = procedure id; direct `apply_change` op allowlist includes `update_element_text`, `produce_artifact`, `add_matrix`. (apc; cae)
- [ ] 1b.10 [GREEN] [S] Implement the `produce_artifact` branch in `apply-change.ts` (like the `comment` branch), `conflicts.ts`, and the allowlist in `server.ts`.
- [ ] 1b.11 [RED] [P] Emitter tests: `convergence-delta.js`, console review/ui-kit/export emit `add_element` followed by N `update_field` ops with no `from` (each with its own evidence), `add_matrix` emits `seed`; no emitter writes `fields`. Files: `sources/test/convergence-delta*.test.js`, console emitter tests.
- [ ] 1b.12 [GREEN] [S] Update `review.js`, `ui-kit.js`, `scripts/export-console.mjs`, `sources/convergence-delta.js`.
- [ ] 1b.13 [S] Regenerate mirrors and console exports if tracked; standard gate. Open PR 3.

Verification: `npm --workspace=@cognnitive/nn-mcp test -- apply-change produce-artifact`, `npm --workspace=@cognnitive/nn-core test`, `node --test scripts/build-core-mirrors.test.mjs`.

---

## S2a - Fold engine in `changelog/` (PR 4, ~500 LOC)

Start: S1b merged. Finish: `buildChangeLog` has units, epoch cut, evidence index, tombstones and `checkProvenance` (fold mode); `console/provenance.ts` and `changeset/history.ts` matching are deleted. Rollback: revert; consumers fall back to S1b state because the rewiring is in this PR.

- [ ] 2a.1 [RED] [S] Fold rule table tests in `core-tests/changelog/fold.test.ts`, one case per row of design A4: `add_element` (alive, no units), `update_field` (to; `''` removes), prose/concept/cell updates (empty equals absent), `rename_element` relink (plain wikilinks, bodies, schema reference fields via `updateReferenceString`; cell keys unaffected; cell values not relinked; origin unchanged), `rename_concept` rekey and relink, `remove_element` tombstones (fields, body, cells by row or col slug), `remove_matrix`, epoch reuse (new element with same slug starts empty), non-applied ignored, `produce_artifact` is an artifact unit not a model unit. (cp: Epoch cut, Origin and history, Matrix cells)
- [ ] 2a.2 [GREEN] [S] Create `core/changelog/{fold,units}.ts`: `Map<UnitKey, UnitState>` in O(C+U), lazy relink events, serialized-form comparison `formatPropertyValue(parsePropertyValue(x))`.
- [ ] 2a.3 [RED] [S] `core-tests/changelog/drift.test.ts`: `EDITED_WITHOUT_RECORD` (mismatch or expected value missing from file), `UNIT_WITHOUT_RECORD` (unit in file with no live entry; element with no frozen slug), `EVIDENCE_UNKNOWN`, `EVIDENCE_SOURCE_CHANGED` (sha mismatch skips anchor checks, anchor error only when sha matches), warnings by default, errors in strict mode, `slug::` and `knowledge_version` are not units, runs only for documents inside a domaiNN, no changeset context yields no diagnostics. Typed values (`price:: 5` to `7`, booleans, lists), `''` field clearing, hand edit, whitespace-only edit is NOT fold drift. (cp: Drift)
- [ ] 2a.4 [GREEN] [S] Create `core/changelog/drift.ts` with `checkProvenance(log, models): ProvenanceReport`.
- [ ] 2a.5 [RED] [P] Evidence index tests: `evidence('live')` uses the last applied change per unit after epoch cut, `evidence('all-time')` every applied change; a removed unit leaves no live edge but stays all-time. (cp: Evidence index)
- [ ] 2a.6 [GREEN] [S] Implement `evidence(scope)` and `tombstones` in `core/changelog/index.ts`.
- [ ] 2a.7 [RED] [P] Performance guard: fold over the largest corpus (benchmark fixture) completes under a documented budget; changelog is browser-safe (no Node imports in `index.ts`, only `node.ts` touches the filesystem).
- [ ] 2a.8 [GREEN/REFACTOR] [S] Delete `core/console/provenance.ts`; reduce `core/changeset/history.ts` (`checkStaleTarget`) to a call into the log; delete `normalizeAddressKey`; update imports. Move any remaining `history.test.ts` cases onto the log.
- [ ] 2a.9 [S] Regenerate mirrors, standard gate. Open PR 4.

Verification: `npm --workspace=@cognnitive/nn-core test -- changelog changeset console`.

---

## S2b - Strict replay and tool surfaces (PR 5, ~600 LOC; over budget)

Start: S2a merged. Finish: `check_domain.provenance`, strict mode, `validate_knowledge` drift, `resolve_sources` from the log, graph edges from live evidence. Rollback: revert; S2a engine stays inert.

- [ ] 2b.1 [RED] [S] `core-tests/changeset/replay-mutations.test.ts`: `replayMutations(model, ops, schema)` clones once and runs all ops on one draft; result equals sequential `applyMutation` output; no quadratic cloning (spy on the clone count equals 1).
- [ ] 2b.2 [GREEN] [S] Add `replayMutations` to `core/mutate.ts`.
- [ ] 2b.3 [RED] [S] `mcp-tests/provenance-strict.test.ts`: `check_domain {strict: true}` rebuilds the `add_model` skeleton via blueprint resolution, replays through `replayMutations`, compares the `serializeModel` body only (frontmatter excluded); no drift for a change-only model; one-byte edit flagged; whitespace-only edit flagged in strict and not in fold; severity error in strict. (cp: Strict mode)
- [ ] 2b.4 [GREEN] [S] Create `mcp/tools/provenance-strict.ts`; accept `strict` in `check-workspace.ts` and `server.ts`.
- [ ] 2b.5 [RED] [P] Differential test (seeded random op sequences, vitest): fold and strict replay agree when there is no drift, and both flag a mutated file. This is the guard against A3 divergence. File: `mcp-tests/provenance-differential.test.ts`.
- [ ] 2b.6 [RED] [P] Contract tests: `check_domain` returns `provenance: ProvenanceReport` and no `lineage` field; `validate_knowledge` with a workspace root reports drift and omits it without one; an LC_programas-like fixture (130 applied changes with `unknown` evidence while units cite sidecars) yields 130 `EVIDENCE_UNKNOWN` plus drift. (cp: `check_domain` reports provenance)
- [ ] 2b.7 [GREEN] [S] Edit `mcp/tools/check-workspace.ts` (+`provenance`, keep the old `lineage` for now, removed in S4), `mcp/tools/validate.ts`.
- [ ] 2b.8 [RED] [P] `resolve_sources`: optional `target` address (cells, bodies), returns `ResolvedCitation[]` of the origin change's evidence items each with `changeId`; follows the last change; cell origin in the console payload. (clv: Consumers)
- [ ] 2b.9 [GREEN] [S] Edit `mcp/tools/resolve-sources.ts`, `core/console/payload-builder.ts` (cells).
- [ ] 2b.10 [RED] [P] Graph: `origin: "source"` edges and `node.sources` built from live evidence; superseded evidence has no edge. File: `core-tests/recursiveParser/*.test.ts`.
- [ ] 2b.11 [GREEN] [S] Edit `core/recursiveParser/normalize.ts` (G13 edges).
- [ ] 2b.12 [S] Mirrors, standard gate. Open PR 5.

Verification: `npm --workspace=@cognnitive/nn-mcp test -- provenance check-workspace resolve-sources`.

---

## S3a - Computed lineage view and `read_lineage` (PR 6, ~500 LOC; over budget)

Start: S2b merged. Finish: `projectLineage(files, log)` is a projection and `read_lineage` exists; the record is still present but unused by consumers of the view. Rollback: revert; the record path is untouched.

- [ ] 3a.1 [RED] [S] `core-tests/naming/contract.test.ts`: `isRegenerableView(path)` true for `artifacts/*_console/**` and `artifacts/Impact_Audit_report*.md`, false for timestamped family artifacts, sidecars and sources. (apc: ARTIFACT_WITHOUT_RECORD)
- [ ] 3a.2 [GREEN] [S] Add `isRegenerableView` to `core/naming/contract.ts`.
- [ ] 3a.3 [RED] [S] `core-tests/lineage/project.test.ts`: inventory from filesystem (sources with sidecar metadata, models, artifacts), computed `version`/`superseded_by` via `familyOf`/`compareMembers`, model upstream = live evidence, artifact upstream = `produce_artifact` evidence, frontmatter `sources` ignored, loose markdown is not a node, `staging/` invisible, `ARTIFACT_WITHOUT_RECORD` warning for unrecorded non-regenerable artifacts (and not for regenerable views), edges `evidence|target|produced` from live evidence by default and all-time with `scope`, changeset nodes with role `changeset`, nothing written. G5 (sidecar sha), G6 `SIDECAR_SUBJECT_MISMATCH`, G7 orphaned sidecar appear in diagnostics; no unlisted-family or dangling `superseded_by` check. (clv; apc)
- [ ] 3a.4 [GREEN] [S] Rewrite `core/lineage/project.ts` as `projectLineage(files, log = buildChangeLog(files)): LineageView`.
- [ ] 3a.5 [RED] [P] `mcp-tests/read-lineage.test.ts`: tool `read_lineage` input `{focus?, scope?}`, output `{sources, models, artifacts, changes, edges, diagnostics}`, writes nothing; tool list contains `read_lineage` (and `sync_lineage` is still present until S4); `check_domain.provenance` includes `ARTIFACT_WITHOUT_RECORD`.
- [ ] 3a.6 [GREEN] [S] Create `mcp/tools/read-lineage.ts`; register in `server.ts`; wire `trannsformPrimitives.ts`; `validator/workspaceSources.ts` takes the evidence of applied changes as its citation sites.
- [ ] 3a.7 [S] Mirrors, standard gate. Open PR 6.

Verification: `npm --workspace=@cognnitive/nn-core test -- lineage naming` and `npm --workspace=@cognnitive/nn-mcp test -- read-lineage`.

---

## S3b - CJS consumers re-sourced and producer payloads (PR 7, ~450 LOC; over budget)

Start: S3a merged (mirror of the log available). Finish: impact-checker, gc, duplicate-guards and the producers read the evidence index and emit `produce_artifact` payloads. Rollback: revert; the record-based paths still exist.

- [ ] 3b.1 [RED] [P] `sources/test/impact-checker*.test.js`: reads evidence sites and compares with `evidence_sha256`; a changed source reports an impact for the dependent change and the unit it set; `[IMPACT WARNING]`, `checkScanImpact`, `detectSourceFamilyEvolution`, `writeImpactReport` (writes into the exempt `Impact_Audit_report*` family) keep their contract. (clv: Consumers)
- [ ] 3b.2 [RED] [P] `sources/test/gc*.test.js`: `citedPaths` = all-time evidence (superseded evidence still protects; cited sidecar counts as cited member); `isRegenerableView` shared (no own exemption list); GC never proposes or deletes anything under `changes/`. (cp: Changesets never pruned)
- [ ] 3b.3 [RED] [P] `sources/test/duplicate-guards*.test.js`: `auditUncitedSources` searches the evidence index and reports `UNCITED_SOURCE_IN_WORKSPACE`.
- [ ] 3b.4 [GREEN] [S] Edit `sources/impact-checker.js`, `gc.js`, `duplicate-guards.js` over the regenerated CJS mirror of `changelog/` (add the new exports to the mirror export list in `scripts/build-core-mirrors.mjs` and its test).
- [ ] 3b.5 [RED] [P] Producer payload snapshots: `curate-csv`, `normalize-file` (when it produces an artifact) and `converge` print a ready `propose_changeset` JSON payload with exactly one `produce_artifact` change (target, evidence, author = procedure) and apply nothing; `--scan`, cognitivize and import emit none. (apc: Producers emit ready payloads)
- [ ] 3b.6 [GREEN] [S] Edit `sources/curate-csv.js`, `index.js` (payload printing, same pattern as `--converge --plan`), `core/writeOnce/plan.ts` (`derived_from` no longer written).
- [ ] 3b.7 [S] `node scripts/build-core-mirrors.mjs`, `node --test scripts/build-core-mirrors.test.mjs`, `npm --prefix skills/nn-sources test`, standard gate. Open PR 7.

Verification: `npm --prefix skills/nn-sources test` and `node --test scripts/build-core-mirrors.test.mjs`.

---

## S4 - Delete the persisted record (PR 8, ~1,600 LOC source and ~2,500 test lines deleted; `size:exception` or split)

Start: S3b merged. Finish: no `lineage-record`, `sync_lineage`, `LINEAGE_DRIFT`, `--lineage/--provenance/--check`, journal or `cogNNitive` blueprint remain; watch roots live in the domaiNN entrypoint. Rollback: revert the PR (restores record, gate and tools); the view from S3 keeps working in both states.

Suggested split if the maintainer rejects `size:exception`: S4-i (tools, gate, guards), S4-ii (nn-sources flags, bootstrap, journal), S4-iii (blueprint, manifest, catalog, vocabulary). Deletions are mechanical but need the order below.

- [ ] 4.1 [RED] [S] Gate tests (`scripts/*.test.mjs`): live code, skills and specs (archive excluded) contain no `lineage-record`, `findLineageRecord`, `sync_lineage`, `LINEAGE_DRIFT`; `roleOf('Acme_cogNNitive_NN.md')` is `knowledge`; `sync_lineage` absent and `read_lineage` present in the tool list; `nn-sources --lineage|--provenance|--check` fail as unknown options and nothing refreshes a lineage after `--scan`, `--normalize-file`, `--cognitivize`, `--curate-csv`, `--unlink`; no `extractDeclaredCitations` or journal append function; `check_domain` has no `lineage` field. (clv; apc; rm)
- [ ] 4.2 [RED] [P] Watch-roots tests: `## NN External Watch Roots` is read from `domaiNN_NN.md`; parsing unchanged; `RECORD_TOKENS` gone; `external-scanner.js` and `domain-probe.js` read the entrypoint. (ewr) The reader MUST move in the same PR as record deletion.
- [ ] 4.3 [GREEN] [S] Move the watch-roots reader to the domaiNN entrypoint in `sources/external-scanner.js`, `domain-probe.js`, `bootstrap.js`; drop `RECORD_TOKENS`.
- [ ] 4.4 [GREEN] [S] Delete `core/lineage/{record,render,drift}.ts`, `mcp/tools/sync-lineage.ts` (and `server.ts` registration), `scripts/lineage-drift-guard.js` and its `verify.js` step, `sources/provenance*.js`, `sources/lineage-check.js`, the lineage fixture domain, the `lineage-record` role in `core/naming/contract.ts`, record guards in `apply-change.ts` (`RECORD_UNVERSIONED`, tool-owned record guard), `legacy-write-guard.js` allowlist entry, bootstrap record creation, `check_domain.lineage`, `extractDeclaredCitations`, `# NN Procedures` journal code.
- [ ] 4.5 [GREEN] [S] Delete `bluepriNNts/cogNNitive/` and `cogNNitive_V_0-2-1_NN.md`; update `manifest/source.yaml`, `catalog.json`, `scripts/blueprint-catalog.mjs`, `core/canonical-registry.ts`, `iNNfo/specs/vocabulary.json` (record vocabulary removed); run `npm run sync:versions`. This is the first piece of the release event; do NOT cut a tag here.
- [ ] 4.6 [REFACTOR] [S] Delete about 2,500 lines of record/render/drift/guard tests and add about 250 lines of replacement gate tests; fix dangling imports and run `rg "lineage-record|findLineageRecord|sync_lineage|LINEAGE_DRIFT"` until 0 in live code.
- [ ] 4.7 [S] Mirrors, standard gate, `node scripts/verify.js` (expect the manifest/pin checks to need the S5b re-pin; record any known-red release check in the PR as intentionally deferred to S5b). Open PR 8.

Verification: `rg "lineage-record|findLineageRecord|sync_lineage|LINEAGE_DRIFT"` returns 0 outside `openspec/changes/archive/`; `node scripts/verify.js`.

---

## S5a - Ban `sources::` and `type:: citation` in kNNowledge (PR 9, ~700 LOC; over budget)

Start: S4 merged (replacement `produce_artifact` and `ARTIFACT_WITHOUT_RECORD` already shipped in S1/S3). Finish: validator bans; sidecar and cognitivize no longer write `sources`; `conflicts::` is an address. Rollback: revert; samples are untouched in this slice.

- [ ] 5a.1 [RED] [S] `core-tests/validator/knowledge-checks.test.ts`: `SOURCES_FIELD_BANNED` and `CITATION_FIELD_BANNED` are errors on L3 for any L1 version; the single allowed `citation` is `changes.evidence`, identified by the parent blueprint (no exemption list); `conflicts::` is `type:: address`; `type:: address` pointers accepted. (ban; A13)
- [ ] 5a.2 [GREEN] [S] Implement the ban in `core/validator/knowledge-checks.ts`.
- [ ] 5a.3 [RED] [P] Cleanup tests: `SOURCE_FIELD_NAMES`, `CONFLICT_FIELD_NAMES`, `dedupeCitationList`, `citationFieldsFor`, `meta.sources` in the console payload, `LEGACY_DERIVATION_KEY` no longer exist; serializer/normalize do not read `sources::`; console payload carries no `meta.sources`. (fcp; ban)
- [ ] 5a.4 [GREEN] [S] Delete those symbols and fix call sites in `core/` and the console.
- [ ] 5a.5 [RED] [P] Sidecar and cognitivize tests: the sidecar has no `sources` key; cognitivize output carries no `sources::`; `core-tests/cognitivize/*.test.ts`, `sources/test/*.test.js`. (ban: source-sidecar, cognitivize-in-place)
- [ ] 5a.6 [GREEN] [S] Cognitivize `core/sidecar.ts` and `core/cognitivize.ts` (no `sources` key); update the nn-sources writers.
- [ ] 5a.7 [S] Mirrors, standard gate. Open PR 9.

Verification: `npm --workspace=@cognnitive/nn-core test -- validator cognitivize` and `npm --prefix skills/nn-sources test`.

---

## S5b - New L1 and sample versions, fixtures, release event (PR 10, ~800 LOC plus corpora; `size:exception` for generated corpora)

Start: S5a merged. Finish: the tracker tip is releasable: new L1 `iNNfo_V_0-6-0`, bumped `changes`/`sidecar`/`visual-catalog`, new sample versions, rebuilt fixtures, `templates-v*` cut and re-pinned, release rehearsed. Rollback: before the tracker merge, revert this PR and delete the unmerged tag; after the merge, revert the merge commit and re-pin the previous `templates-v*`.

- [ ] 5b.1 [RED] [S] Spec-integrity tests: `iNNfo/specs/iNNfo/iNNfo_V_0-6-0_NN.md` exists, defines `citation` only as change `evidence` and the reserved `sources::` as banned; `iNNfo_V_0-5-0` is byte-identical (write-once); only `changes`, `sidecar`, `visual-catalog` pin V_0-6-0; `visual-catalog` `source` fields are not `citation`; `check:spec-urls` passes (write `cogNNitive/iNNfo` slug as split code spans in `openspec/specs/`).
- [ ] 5b.2 [GREEN] [S] Create `iNNfo_V_0-6-0_NN.md`; bump `sidecar` (no `sources`) and `visual-catalog`, repin them; register new `template_version` values in `SHIPPED_TEMPLATE_VERSIONS`; set `spec_version` vs `template_version` per the two-axes rule; `npm run sync:versions`.
- [ ] 5b.3 [GREEN] [S] New workspace spec version without `# NN Executions` (Executions concept and execution-trace fields removed); the published workspace spec is not edited; rebuild the `simulacro-refactorizacion` fixture that used it. (wep)
- [ ] 5b.4 [RED] [S] Samples test: business-model V_0-4-1, metrics V_0-5-0, organization V_0-4-0 are superseded by new patch versions with no `sources::`/`type:: citation`, built through changes; the old 3 files are deleted (allowed by R-SV-02 because samples are not domaiNN members; guard passes deletions); no remaining reference to the deleted files.
- [ ] 5b.5 [GREEN] [S] Create the three new sample versions, delete the three superseded files, update references and catalogs; rebuild fixtures and docs corpora (~123 files with `sources::`) through `propose_changeset`/`apply_change` where behavior is checked, or mechanically where it is a plain corpus. Update `scripts/migrate-domain.js` and `scripts/build-script-from-draft.mjs` for the new emitters.
- [ ] 5b.6 [S] Release steps at the tracker tip: bump `manifest/source.yaml` versions (`spec_version` axis for `version:`), `npm run sync:versions`; cut `templates-v*` at tracker HEAD (plus `skills-v*` and `innfo-mcp` tags if their versions moved); repin `channels.stable.refs`; regenerate `docs/use/manifest.md` in the same commit (the manifest render is byte-checked and must stay deterministic). Tags are created only after the maintainer confirms.
- [ ] 5b.7 [S] Rehearsal in a detached worktree: `git worktree add --detach <tmp> <sha>`, then `node scripts/verify.js --release` and `node scripts/validate-manifest.mjs --channel stable` there (builds only, no `npm ci`; reuse the junctioned `node_modules`), then remove the temp worktree with `git worktree remove`. Also run `npm --prefix skills/nn-trannsform ci` ONLY on CI, never locally.
- [ ] 5b.8 [S] Standard gate, preflight fixtures with empty `HOME`/`USERPROFILE`, mirrors. Open PR 10.

Verification: `node scripts/verify.js --release` in the detached worktree, `node scripts/validate-manifest.mjs --channel stable`, `node scripts/check-integrity.mjs` (or the `nn-dev-check-integrity` skill).

---

## S6 - Living specs, skills, docs (PR 11, ~1,000 LOC; docs, may take `size:exception` if the maintainer agrees)

Start: S5b merged. Finish: skills, shared rules, vocabulary and docs describe change-based provenance; mirrors regenerated. Rollback: revert; no code behavior changes.

- [ ] 6.1 [RED] [S] Doc/skill tests (`scripts/*.test.mjs`, skill tests): no skill or doc mentions `sync_lineage`, `--lineage`, a persisted record, `sources::` as authoring syntax, `update_description`, `get_lineage`; the skills mention `read_lineage`, `update_element_text`, `produce_artifact`; `skill-shared-rules.md` parity test passes against the skills.
- [ ] 6.2 [GREEN] [P] Rewrite `skills/nn-sources/SKILL.md`, `skills/nn-innfo/SKILL.md` (section 16-bis.4: emit `produce_artifact` instead of journal entries), `skills/nn/SKILL.md`, `scripts/skill-shared-rules.md`; regenerate generated mirrors with `node scripts/build-core-mirrors.mjs` and the skill-rules generator.
- [ ] 6.3 [GREEN] [P] Docs under `docs/documentation/**` and `docs/documentation/content/vocabulary.md`: the console "Lineage" tab shows change history, distinct from the removed record; `vocabulary.json` entries (Source/Citation/Lineage) updated; rebuild the dogfooding model `documentation_NN.md` consistently if the docs index is generated.
- [ ] 6.4 [S] Update the openspec living specs through the archive phase later (not here); run the full docs build and standard gate. Open PR 11.

Verification: docs build, `node scripts/verify.js`, `rg "sync_lineage|get_lineage|update_description" skills docs` returns 0.

---

## S7 - Final verify (no code PR; runs on the tracker tip)

Finish: every success criterion of the proposal is demonstrated; the tracker is ready for a merge commit.

- [ ] 7.1 [S] `rg "lineage-record|findLineageRecord|sync_lineage|LINEAGE_DRIFT"` returns 0 in live code, skills and specs (archive excluded). (proposal criterion 1)
- [ ] 7.2 [S] A domain built only through changes has no `sources::` or `type:: citation`; the validator rejects one added by hand. (criterion 2)
- [ ] 7.3 [S] Origin of every field and every matrix cell derives from applied changes with deterministic order and no inherited history after slug reuse. (criterion 3)
- [ ] 7.4 [S] A hand edit of a field or cell, and a unit with no change, fire `EDITED_WITHOUT_RECORD`/`UNIT_WITHOUT_RECORD` in `validate_knowledge` and `check_domain`; strict mode escalates. (criterion 4)
- [ ] 7.5 [S] The LC_programas-like fixture produces visible diagnostics (`EVIDENCE_UNKNOWN`). (criterion 5)
- [ ] 7.6 [S] Every non-regenerable artifact has a `produce_artifact` or `ARTIFACT_WITHOUT_RECORD` fires. (criterion 6)
- [ ] 7.7 [S] impact-checker, gc, duplicate-guards and `resolve_sources` pass against the evidence index. (criterion 7)
- [ ] 7.8 [S] `node scripts/verify.js --release` and CI green after the re-pin; the empty-`HOME` preflight run is green; mirrors up to date.
- [ ] 7.9 [S] Open questions recorded for the archive: strict replay ignores frontmatter and hand reordering of elements is strict-only drift; matrices have no frozen slug so a `remove_matrix` plus `add_matrix` rename loses cell history; `workspace-executions-provenance` is removed (decided in specs).
- [ ] 7.10 [S] Merge the tracker into `main` with a merge commit (not a squash); then run `sdd-verify` and `sdd-archive` (diff and `wc -l` the archive copy; haiku archive truncation has happened before).

---

## Dependency summary

| Slice | Depends on | Parallel inside |
|---|---|---|
| S0 | none | 0.6 and 0.8 test authoring |
| S1a | S0 | none |
| S1b | S1a | 1b.5, 1b.7, 1b.9, 1b.11 test authoring |
| S2a | S1b | 2a.5, 2a.7 |
| S2b | S2a | 2b.5, 2b.6, 2b.8, 2b.10 |
| S3a | S2b | 3a.5 |
| S3b | S3a | 3b.1 to 3b.3, 3b.5 |
| S4 | S3b (replacement before deletion) | 4.2 |
| S5a | S4 | 5a.3, 5a.5 |
| S5b | S5a | none (release is serial) |
| S6 | S5b | 6.2, 6.3 |
| S7 | S6 | none |

Order guarantee: a capability is removed only after its replacement ships. View, tool and producer payloads (S3) land before record and journal deletion (S4). `produce_artifact` (S1) and `ARTIFACT_WITHOUT_RECORD` (S3) land before sidecar `sources` removal (S5). The watch-roots reader moves in the PR that deletes the record (S4).

## Review Workload Forecast

| Slice | PR | Est. changed lines (excl. generated) | Over 400? |
|---|---|---|---|
| S0 | 1 | ~300 | No |
| S1a | 2 | ~350 | No |
| S1b | 3 | ~550 | Yes |
| S2a | 4 | ~500 | Yes |
| S2b | 5 | ~600 | Yes |
| S3a | 6 | ~500 | Yes |
| S3b | 7 | ~450 | Yes |
| S4 | 8 | ~1,600 source (+~250 tests added, ~2,500 test lines deleted) | Yes |
| S5a | 9 | ~700 | Yes |
| S5b | 10 | ~800 + mechanical corpora | Yes |
| S6 | 11 | ~1,000 | Yes |
| Total | 11 PRs | ~7,350 + deletions and corpora | |

- Chained PRs recommended: Yes (feature-branch-chain, proposed; pending maintainer confirmation)
- 400-line budget risk: High. Eight of the eleven slices exceed 400 lines.
- Decision needed before apply: Yes. For each over-budget slice, choose between a further sub-split (suggested cut points: S1b into stamping (1b.1-1b.4) and ops/emitters (1b.5-1b.12); S2b into strict (2b.1-2b.5) and surfaces (2b.6-2b.11); S4 into three PRs as listed; S5b into L1/blueprints/samples and release) and a recorded `size:exception` (most defensible for S4 deletions, S5b corpora and S6 docs). Also confirm: the `feature-branch-chain` strategy, and the permission to cut `templates-v*` tags at S5b.
