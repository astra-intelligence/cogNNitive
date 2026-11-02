# Apply progress: coNNtent redesign (`2026-11-02-video-script-v1`)

Append-only per-slice log. Merge new entries into this file; never overwrite it.

Chain: tracker `feature/conntent-v1` (cut from `origin/dev`, with `origin/session/video-redesign` merged).
Every slice branch is `feature/conntent-v1-<slice>`; the first PR targets the tracker, each later PR
targets the previous slice's branch. Nothing merges into `dev` or `main` from this chain.

## Slice D — Align OpenSpec artifacts with the resolved decisions (docs-only)

- Branch: `feature/conntent-v1-d` (base `feature/conntent-v1`)
- PR: https://github.com/cogNNitive/cogNNitive/pull/462
- Commits: `d3c002f2` docs(openspec): align coNNtent V_1-0-0 artifacts with the resolved decisions
- Scope: `proposal.md`, `design.md`, `specs/*/spec.md`, `tasks.md` in this change folder.
- Changes:
  - Four Layer behaviour types (`avatar`, `media`, `text`, `animation`); appearance and visual
    components moved into Presets. New requirement "Layer Types Are Four Behaviours" in
    `video-script-model`, with `placement`, `timing`, `style` and `source` in the field table.
  - `avatar` is the only name; `presenter`, `talking_avatar` and `talking-avatar` are retired with no
    alias (`video-script-model` retired names, `video-blueprint` conditional fields keyed by Layer
    type, `cognnitive-video-engine` render refusal, `video-presets`, `video-model-catalog`).
  - No blueprint default for `budget` or `language`: an unset budget always asks at the budget gate
    and an unset language is a validation error (`video-script-model`, `video-script-review`,
    `video-scene-kinds`, `cognnitive-video-engine`).
  - `series/<s>/assets/` holds series media and episodes are discovered only under
    `series/<s>/episodes/`; a legacy episode folder in `assets/` is ignored (`video-folder-contract`,
    `design.md` folder contract).
  - Episode document is `<slug>_coNNtent_<s>_NN.md`; a bare `<slug>_NN.md` is rejected
    (`video-folder-contract`, `design.md`).
  - Facts stay gitignored, one log per machine, and every ledger row carries the machine fingerprint
    (`video-run-facts`, `design.md`).
  - Chapters are written between `<!-- chapters:start -->` and `<!-- chapters:end -->`
    (`video-publication-description`, `design.md`).
  - `infinitetalk` stays an active, allowed avatar model with no warning (`video-model-catalog`,
    `proposal.md`, `cognnitive-video-engine` disposition table).
  - Rename to `coNNtent` / `nn-conntent` reflected in paths, catalog and `parent_spec` references,
    mirror target, console views and episode pin, keeping OpenSpec capability names `video-*`.
  - Design "Open for maintainer" closed as "Resolved by the maintainer (2026-11-02)".
- Verification:
  - `node scripts/check-openspec-deltas.mjs` → `openspec deltas OK: 20 delta spec file(s) checked.`
  - `prettier --check` on the change folder → all files use Prettier code style.
  - Retired-term sweep (`presenter`, `talking_avatar`, `brand`, `budget:: 0`, `language=en` default,
    bare `<slug>_NN.md`): only explicit retired-name enumerations, the rejection rule and historical
    audit text in `exploration.md` remain. `exploration.md` and `handoff.md` were left untouched
    (historical audit and protocol record, outside Slice D's edit scope).
- Deviations: none on product decisions. The Slice D verify line in `tasks.md` was refined to allow
  explicit retired-name enumerations in addition to `REMOVED` blocks; the intent (no old type or
  default survives as a rule) is unchanged.
- CI note: `.github/workflows/ci.yml` runs on push to `main`, `dev` and `session/**`, and on PRs whose
  base is `main` or `dev`. A `feature/**` slice branch therefore reports no checks; the gate used here
  is the full offline `node scripts/verify.js` (the same steps CI runs), matching the existing chain
  PRs #443–#461. The PR stays open for the maintainer to merge into the tracker.
- Environment note: the primary checkout's `node_modules/.bin` is empty, so `npm run build` could not
  find `tsc`/`tsup`. Built nn-core in the primary (gitignored `dist/` only) and used throwaway `.cmd`
  shims in the worktree's gitignored `temp/shim/` to run the workspace builds. No lockfile or source
  file was touched.
- Open issues: none. No test code changes in this slice (docs-only), so no RED/GREEN cycle applies.

## Slice 0a — Quick wins on the engine (V_0-14-x)

- Branch: `feature/conntent-v1-0a` (base `feature/conntent-v1-d`)
- PR: pending
- TDD: RED first (`image-cache-key.test.mjs`, the new `render-formats` sections, `avatar-render-refusal.test.mjs`), then GREEN.
- Changes:
  - `lib/image-options.mjs`: the image key now carries the cascaded `image_model` as `model` and no longer the display `title`. Release note: the first run after this change re-bills images once.
  - `video-engine-cli.mjs` passes the cascade-resolved `image_model` into `buildImageOptions`, so the compile key and the estimator key agree.
  - `render-formats.mjs`: every non-blur filter graph names its output `[v]` (the `-map [v]` that follows had no labelled stream, so `--fill crop` could not produce output), and the CLI accepts `--fill crop|blur` and `--force`.
  - `lib/avatar-jobs.mjs` + `renderVideo`: a render refuses when an `avatar` Layer has no cached lip-sync clip, naming every `scene/layer` and `synthesize-avatar.mjs`; there is no override flag.
- Verification: `node --test "test/*.test.mjs"` in the skill → 413 tests, 413 pass. Full `node scripts/verify.js` run before the PR.
- Deviations: none. Open issues: none.

## Slice 0b — Quick wins on the console and the guard (V_0-14-3)

- Branch: `feature/conntent-v1-0b` (base `feature/conntent-v1-0a`)
- PR: pending
- TDD: RED first (`draft-template-preset-only.test.mjs`, `unpriced-model-warning.test.mjs`), then GREEN.
- Changes:
  - `draft-template.html`: the video parameter grid and the scene exception drawer are gone, so the preset selector is the only control. The script build no longer emits `background_audio`, `background_audio_volume` or `transition` overrides that no control can produce.
  - `asset-cost-estimator.mjs`: `unpricedAllowedModels` and `warnUnpricedAllowedModels` emit exactly one warning per allowed model without a catalog price, and the run continues at the conservative fallback rate. `compileVideo` warns at guard load too. `infinitetalk` stays allowed and priced, so it is silent (decision 8).
  - Blueprint `V_0-14-3`, skill `V_0-15-9`, regenerated catalog.
- Verification: skill suite 420 tests, 420 pass; `node scripts/verify.js` green.
- Deviations: none. Open issues: none.

## Slice 1 — Core mirror target `coNNtent` (V_0-14-4)

- Branch: `feature/conntent-v1-1` (base `feature/conntent-v1-0b`)
- PR: pending
- TDD: RED first (`test/core-mirror-coNNtent.test.mjs`), then GREEN.
- Changes:
  - New bundler entry `scripts/core-mirrors/coNNtent.ts` re-exporting the nn-core scope fold, `parseKnowledge`, `slugify`, `serializeKnowledge`, `parseChangeset`, `serializeChangeset`, `computeProposalSha`, plus nn-mcp's `executeChangesetApply` and `writeProposedChangeset`.
  - `scripts/build-core-mirrors.mjs`: the `scope` target is replaced by `coNNtent`; the output stays `lib/nn-core.generated.cjs`.
  - `scripts/lib/knowledge-model.mjs` is now a thin adapter over the mirror's `parseKnowledge` (no private frontmatter reader or markdown parser); its public API is unchanged, so all 420 skill tests stay green.
  - `tsconfig.scripts.json` excludes `scripts/core-mirrors/**` (the bundler entry pulled nn-core/nn-mcp sources into a program with different strictness).
  - `test/no-retired-references.test.mjs`: the new mirror joins the generated-artifact allowlist (it embeds the write-once specs, like `console-payload.generated.cjs`).
  - Blueprint `V_0-14-4`, skill `V_0-15-10`, regenerated catalog.
- Bundle size (design A10): **821,953 bytes** (`lib/nn-core.generated.cjs`), up from 333,607 bytes for the scope-only mirror. Not unreasonably large, so no maintainer stop was needed.
- Verification: skill suite 420 tests, 420 pass; `node scripts/verify.js` green (229 steps).
- Deviations: `lib/knowledge-model.mjs` is kept as a one-function adapter instead of being deleted, because seven consumers still import its API; deletion belongs with the `produce` rewrite (Slice 7b). Open issues: none.

## Slice R — Rename the bluepriNNt to coNNtent (size:exception, mechanical)

- Branch: `feature/conntent-v1-r` (base `feature/conntent-v1-1`)
- PR: pending
- Changes:
  - `git mv iNNfo/specs/bluepriNNts/video-script iNNfo/specs/bluepriNNts/coNNtent` and `git mv .../skills/nn-video-script .../skills/nn-conntent`; no alias, no redirect.
  - Swept 171 live files: `nn-video-script` → `nn-conntent`, blueprint path → `coNNtent`, `video-script_V_*` → `coNNtent_V_*`, and the bare blueprint id, while keeping OpenSpec capability names `video-script-model`, `video-script-review`, `video-script-skill` and the change id `2026-11-02-video-script-v1`.
  - `scripts/core-mirrors/video-script.ts` → `scripts/core-mirrors/coNNtent.ts`; `build-core-mirrors.mjs` target `coNNtent`.
  - Frontmatter `blueprint_name: "coNNtent"`, display title `coNNtent App`; blueprint `V_0-14-5`, skill `V_0-15-11`; both catalogs regenerated (`npm run regen`, `build-docs`).
  - New guard `test/blueprint-rename.test.mjs` pins the folder, the skill name, both catalogs, the mirror target and the absence of leftover references.
- RED/GREEN: the guard's assertions are red on the base tree (catalog has no `coNNtent` key and `build-core-mirrors.mjs` has no `coNNtent` target — verified with `git show HEAD:...`), green after the move.
- Verification: `node scripts/verify.js` green (229 steps) including template immutability (a rename changes `spec_NN.md`, hence the `V_0-14-5` bump), sample coherence and core-mirror freshness.
- Deviations / accepted residuals:
  - `iNNfo/specs/bluepriNNts/design-presets/spec_NN.md` keeps one prose sentence naming `nn-video-script`: changing that blueprint requires a version bump plus a sample refresh at two sites, out of a mechanical rename's scope. It is encoded as an accepted exception in the guard.
  - The frozen `video-golden` corpus keeps its historical `<nn-video-script>` strings; it is a frozen fixture of earlier episodes, like the archives.
  - `openspec/changes/**` and `openspec/specs/**` keep `video-*` capability names by decision 9.
- Open issues: none.
