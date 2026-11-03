# Apply progress: distributed-storage

## S0 - Provenance ban gate (PR 1)

Status: S0.1 and S0.2 done; S0.3 (standard PR gate, open PR) left open: the PR is opened by the orchestrator and `verify:fast` has two failures outside S0 (see Gate).

### Claim check (before editing)
`checkProvenanceBan` in `iNNfo/packages/nn-core/src/validator/knowledge-checks.ts` gated on `/V_0-6-0/i.test(scope)`, where scope = `${l1Version} ${parentName} ${parentUrl}`. Confirmed: only the literal `V_0-6-0` fires the ban; `V_0-7-0` and `V_0-10-0` do not. The only caller (`validator/knowledge.ts:168`) passes the template `parent_spec.name` as `l1Version`.

### Tasks
- [x] S0.1 RED: five cases appended to `src/validator/knowledge-checks.spec.ts` (describe "checkProvenanceBan - L1 version gate"): `V_0-6-0` banned, `V_0-7-0` banned, `V_0-10-0` banned (numeric), `V_0-5-9` not banned, and a guard that a bluepriNNt version (`business_V_0-9-0`) is not an L1 pin.
- [x] S0.2 GREEN: `l1AtLeast(scope, floor)` (exported) plus `PROVENANCE_BAN_FLOOR = 'V_0-6-0'`; numeric per-component compare; no per-version regex.
- [ ] S0.3 left to the orchestrator (open PR 1).

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
