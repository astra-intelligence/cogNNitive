# Apply progress: distributed-storage

## Chain status (updated 2026-11-03)

Strategy: chained PRs, `feature-branch-chain`, tracker `feature/distributed-storage`; `size:exception` admitted per slice without a declared split. Only the tracker reaches `main`.

| Slice | PR | Branch | Base | State |
|---|---|---|---|---|
| S0 | 495 | `ds/s0` | tracker | open, applied |
| S1a | 500 | `ds/s1a` | `ds/s0` | open, applied (648 lines, `size:exception`) |
| Docs (side PR) | 501 | `docs/distributed-storage` | `ds/s0` | open; vocabulary, skills and gate test stay in S7c |
| S1b to S7d | n/a | n/a | n/a | not started |

Pending decisions: none blocking. Labels: the repo has no `size:exception` label; the exception is recorded in each PR body.

## S0 - Provenance ban gate (PR 1)

Status: S0 done (S0.1, S0.2, S0.3). The two `verify --fast` failures the apply pass reported were resolved by the orchestrator: the "Check OpenSpec Delta Specs" failure was real planning text (ADDED requirements in `specs/citation-parser-resolver/spec.md` and `specs/stable-element-identity/spec.md` lacked MUST; both now carry it), and the "Docs-Derived Facts Drift Guard" failure was environmental (nn-mcp `dist/` not built in the worktree; built with `tsup --config tsup.dist.config.ts`). `node scripts/verify.js --fast` then passed in full.

### Claim check (before editing)
`checkProvenanceBan` in `iNNfo/packages/nn-core/src/validator/knowledge-checks.ts` gated on `/V_0-6-0/i.test(scope)`, where scope = `${l1Version} ${parentName} ${parentUrl}`. Confirmed: only the literal `V_0-6-0` fires the ban; `V_0-7-0` and `V_0-10-0` do not. The only caller (`validator/knowledge.ts:168`) passes the template `parent_spec.name` as `l1Version`.

### Tasks
- [x] S0.1 RED: five cases appended to `src/validator/knowledge-checks.spec.ts` (describe "checkProvenanceBan - L1 version gate"): `V_0-6-0` banned, `V_0-7-0` banned, `V_0-10-0` banned (numeric), `V_0-5-9` not banned, and a guard that a bluepriNNt version (`business_V_0-9-0`) is not an L1 pin.
- [x] S0.2 GREEN: `l1AtLeast(scope, floor)` (exported) plus `PROVENANCE_BAN_FLOOR = 'V_0-6-0'`; numeric per-component compare; no per-version regex.
- [x] S0.3 standard PR gate: `verify.js --fast` green; PR 1 opened against the tracker `feature/distributed-storage`.

### TDD evidence
- RED: `node ../../../node_modules/vitest/vitest.mjs run src/validator/knowledge-checks.spec.ts` (cwd `iNNfo/packages/nn-core`): 14 tests, 2 failed (`V_0-7-0` and `V_0-10-0`: `expected [] to include 'SOURCES_FIELD_BANNED'`), the right reason. The `V_0-6-0`, `V_0-5-9` and bluepriNNt-version cases passed already (they pin existing behavior).
- GREEN: same command plus `tests/validator/knowledge-checks.test.ts`: 2 files, 19 tests passed.
- REFACTOR: none needed.

### Deviations
1. Test file: tasks.md and the orchestrator name `src/validator/knowledge-checks.spec.ts`; used it. Note that `iNNfo/packages/nn-core/tests/validator/knowledge-checks.test.ts` DOES exist (it holds the existing `checkProvenanceBan` tests), contrary to the note in tasks.md. Left untouched; passes.
2. `l1AtLeast` only counts tokens of the form `iNNfo_V_x-y-z`, not any `V_x-y-z`. The old regex matched a bluepriNNt version too (`business_V_0-6-0`), which was accidental; counting any token with a `>=` rule would newly ban every document whose bluepriNNt is at or after 0-6-0 regardless of its L1. Verify phase: confirm no caller relies on a bare `V_0-6-0` without the `iNNfo_` prefix (the full nn-core suite is green).

### Line counts (hand-authored)
- `knowledge-checks.ts`: +34 / -4 (diff stat 38 lines changed).
- `knowledge-checks.spec.ts`: +57 / -1 (58 lines changed).
- Total 92 insertions, 4 deletions. No generated files. Below the 400-line budget; no `size:exception` needed.

### Gate (S0 verification)
- `node ../../../node_modules/typescript/bin/tsc` (nn-core): exit 0.
- `vitest run` full nn-core: 204 files, 2118 tests passed.
- `node scripts/verify.js --fast`: 202 of 204 steps green; 2 failures, neither caused by S0:
  - "Check OpenSpec Delta Specs": `specs/citation-parser-resolver/spec.md:80` and `specs/stable-element-identity/spec.md:48` have ADDED requirements without SHALL/MUST (pre-existing planning text in the change folder).
  - "Docs-Derived Facts Drift Guard": nn-mcp `dist/server.js` is not built in this worktree (environment).
- For verify: both failures need a decision outside S0 (spec wording fix; build nn-mcp before the drift guard).

## S1a - Address module, unwired (PR 2, branch `ds/s1a`, targets `ds/s0`)

Status: S1a done (S1a.1 to S1a.6). Nothing outside the new module and its tests references it.

### Claim check (before editing)
- `core/address/` did not exist. `roleOf` and `parseName` live in `src/naming/contract.ts` (pure, browser-safe) and are reused for the path-class decision. `tests/browser-safe.test.ts` only tested the browser entry export list, so S1a.5 adds a per-module source check instead of an export check.
- `MODEL_CITED_BY_PATH` and `NN_DOCUMENT_CITED_BY_HEADING` are new codes; no existing code defines them.

### Tasks
- [x] S1a.1 RED `tests/address/parse.test.ts` (35 tests).
- [x] S1a.2 GREEN `src/address/{index,parse,grammar}.ts`.
- [x] S1a.3 RED `tests/address/format.test.ts` (59 tests including a generated round-trip table: 4 model-id shapes x 7 unit kinds plus bare ids, relative, blueprint and source rows).
- [x] S1a.4 GREEN `src/address/format.ts`.
- [x] S1a.5 RED+GREEN `tests/browser-safe.test.ts` extended (6 new tests).
- [x] S1a.6 REFACTOR: one pattern source (`grammar.ts`) used by parse and format; built into S1a.2 and confirmed by S1a.4 (format imports the same constants).

### TDD evidence
- S1a.1 RED: `node ../../../node_modules/vitest/vitest.mjs run tests/address/parse.test.ts` (cwd `iNNfo/packages/nn-core`): suite failed to load, module `../../src/address/index` absent (the right reason). GREEN: same command, 35 passed.
- S1a.3 RED: `... run tests/address/format.test.ts`: suite failed, `formatAddress` not a function (export absent). GREEN: `... run tests/address`: 2 files, 94 passed.
- S1a.5: the new tests pass on the first run because the module is already clean, so RED was proven by mutation: appended an `import { join } from 'node:path'` line to `src/address/format.ts`, observed `format.ts imports no node built-in` fail (1 failed, 8 passed), restored the file, 9 passed. A matcher self-test (`flags a node import when one is present`) stays in the suite.
- Triangulation: each unit kind has a positive and a rejecting case; model ids cover compact stem, one-segment and three-segment; the `specs` head has positive and negative cases.
- REFACTOR: only `grammar.ts`; tests re-run green.

### Design decisions inside S1a (beyond design section 6)
1. `Address` has two extra kinds, `blueprint` (`specs/<family>[@concept:|@matrix:]`) and `source` (`{ raw }`), because tasks.md requires the parser to classify those without parsing them. `parseAddress` returns `Address | AddressError`; `isAddressError` narrows.
2. `AddressError = { kind: 'error', code, segment, message, removed? }` with codes `ADDRESS_MALFORMED`, `MODEL_CITED_BY_PATH`, `NN_DOCUMENT_CITED_BY_HEADING`. Removed forms (`[[Title :: Name]]`, bare `Title :: Name`, `[[Name]]`) are `ADDRESS_MALFORMED` with `removed` set to `title-qualified reference` or `wikilink reference`, and the message names the removed shape and the grammar to use. No new code name was introduced (the S7c gate greps for the retired qualified-reference identifiers, so none appears in the module).
3. Path-class classification without the filesystem: the part before the first `@` ends in `.md`, `.csv` or `.json`. A `.md` is a model if `roleOf` says `knowledge` (`MODEL_CITED_BY_PATH`), a changeset if its stem ends `_changes` (`NN_DOCUMENT_CITED_BY_HEADING`); anything else (sidecars, plain markdown, `sources/` paths, entrypoint, spec, catalogs, procedures, CSV, JSON) is `source`. A bare `sources/x.pdf` falls to the model grammar and is `ADDRESS_MALFORMED` (the `.` is not a slug character). `sources` is NOT reserved as a model-id head (only `specs`, per A-6).
4. `specs` reserved: `specs/<family>@...` is a blueprint address; a bare `specs` is `ADDRESS_MALFORMED`. The model-index `RESERVED_MODEL_ID` error is S2b.3.
5. Segment grammar: head `[A-Za-z0-9]+([-_][A-Za-z0-9]+)*`; later segments and element, matrix, row and column slugs `[a-z0-9]+(-[a-z0-9]+)*`; field and concept names accept Unicode letters and digits (`-` and `_` joins; concept names also allow a space). The design ABNF leaves `field` and `Name` undefined; these follow `normalizeName` and existing concept names. A matrix unit allows no sub-unit (the legacy `parseUnitAddress` tolerated them).
6. `formatAddress` validates every segment against the same patterns and throws `TypeError` on one the parser would reject, so a writer cannot persist a non-parseable value.

### Deviations from tasks.md
1. Added `core/address/grammar.ts` (not listed): S1a.6 requires one pattern source shared by parse and format; putting the patterns in `index.ts` would create a runtime import cycle (index re-exports parse and format).
2. S1a.5: the test asserts the module sources import no node built-in (design: keep the module free of `fs` and `path`) instead of checking an export from `browser.ts`; exporting from `browser.ts` is S1b.7.
3. nn-mcp `dist/server.js` (needed by the Docs-Derived Facts Drift Guard): the documented `tsup --config tsup.dist.config.ts` resolves `@cognnitive/nn-core` through the junction to the PRIMARY checkout's `dist/`, which is stale (missing `splitEvidence`, `isChangesetPath`, `canonicalUnitModelId`), so it fails here. Workaround without touching the primary: built nn-core in the worktree (`tsc`; `dist/` is git-ignored), then ran tsup with a throwaway config (deleted, not committed) that aliases `@cognnitive/nn-core` to the worktree `nn-core/dist/index.js`. Environmental; for verify: the primary nn-core `dist/` needs a rebuild.

### Line counts (hand-authored, `git diff --stat ds/s0..HEAD` before this docs commit)
- Production: `address/format.ts` 64, `grammar.ts` 24, `index.ts` 45, `parse.ts` 174 = 307.
- Tests: `address/parse.test.ts` 206, `address/format.test.ts` 112, `browser-safe.test.ts` +23 = 341.
- Total 648 insertions, 0 deletions, no generated files. The forecast was ~350, so this slice exceeds the 400-line budget (the forecast undercounted the parser's removed-form, classification and per-segment diagnostics). `size:exception` applies (admitted by the maintainer for a slice with no declared fallback split). The module is one cohesive inert unit.

### Gate (S1a verification)
- `vitest run tests/address tests/browser-safe.test.ts`: 3 files, 103 passed.
- `vitest run` full nn-core: 206 files, 2218 tests passed (after building nn-core `dist/`; `tests/node-esm-smoke.test.ts` needs it and was the only failure before, environmental).
- `node ../../../node_modules/typescript/bin/tsc --noEmit` (nn-core): exit 0. nn-mcp not touched.
- `node scripts/verify.js --fast`: all deterministic pre-checks passed (204 steps) once nn-mcp `dist/server.js` was built as described.

### For the verify phase
- Confirm the `size:exception` call on PR 2 (648 lines against a ~350 forecast).
- `parseAddress` returns `source` for any `.md|.csv|.json` value that is not a model or changeset document, including sidecars; S1b delegates real source parsing to the existing `sourceRef` branch.
- The parser accepts concept names containing a space; S1b should confirm canonical `concept:` addresses stay slug-like (`unitAddress.section` slugifies the concept, the address module does not).
