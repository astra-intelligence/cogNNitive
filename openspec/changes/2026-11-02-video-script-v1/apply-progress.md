# Apply progress: coNNtent redesign (`2026-11-02-video-script-v1`)

Append-only per-slice log. Merge new entries into this file; never overwrite it.

Chain: tracker `feature/conntent-v1` (cut from `origin/dev`, with `origin/session/video-redesign` merged).
Every slice branch is `feature/conntent-v1-<slice>`; the first PR targets the tracker, each later PR
targets the previous slice's branch. Nothing merges into `dev` or `main` from this chain.

## Slice D — Align OpenSpec artifacts with the resolved decisions (docs-only)

- Branch: `feature/conntent-v1-d` (base `feature/conntent-v1`)
- PR: https://github.com/cogNNitive/cogNNitive/pull/462
- Commits: `d3c002f2` docs(openspec): align coNNtent V_0-15-0 artifacts with the resolved decisions
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
- PR: https://github.com/cogNNitive/cogNNitive/pull/467
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
- PR: https://github.com/cogNNitive/cogNNitive/pull/469
- TDD: RED first (`draft-template-preset-only.test.mjs`, `unpriced-model-warning.test.mjs`), then GREEN.
- Changes:
  - `draft-template.html`: the video parameter grid and the scene exception drawer are gone, so the preset selector is the only control. The script build no longer emits `background_audio`, `background_audio_volume` or `transition` overrides that no control can produce.
  - `asset-cost-estimator.mjs`: `unpricedAllowedModels` and `warnUnpricedAllowedModels` emit exactly one warning per allowed model without a catalog price, and the run continues at the conservative fallback rate. `compileVideo` warns at guard load too. `infinitetalk` stays allowed and priced, so it is silent (decision 8).
  - Blueprint `V_0-14-3`, skill `V_0-15-9`, regenerated catalog.
- Verification: skill suite 420 tests, 420 pass; `node scripts/verify.js` green.
- Deviations: none. Open issues: none.

## Slice 1 — Core mirror target `coNNtent` (V_0-14-4)

- Branch: `feature/conntent-v1-1` (base `feature/conntent-v1-0b`)
- PR: https://github.com/cogNNitive/cogNNitive/pull/471
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
- PR: https://github.com/cogNNitive/cogNNitive/pull/473
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

## Slice 2a — Spec text V_0-15-0 (maintainer decisions 1–9 + D1–D5)

- Branch: `feature/conntent-v1-2a` (base `feature/conntent-v1-r`)
- PR: pending
- Decisions resolved by the maintainer: D1 `style` enum on `text` Layers; D2 explicit `source:: narration`; D3 conditional fields as OR groups keyed by the four types; D4 catalog Concepts in the same blueprint; D5 a single `blueprint_version` axis, **versioned `V_0-15-0`** (never a `1.0`). Recorded in `decisions-2a.md`; the requirement matrix is `traceability-2a.md` (138 requirements: 22 owned by 2a, 19 spec+code, 97 out of scope).
- Changes:
  - `spec_NN.md` rewritten to V_0-15-0: 6 new Concepts (`Scene Kind`, `Chrome`, `Variant`, `Provider`, `Model`, `Voice`), four Layer behaviour types with `style`/`source`/`placement`/`timing`, `kind`/`review`/`for`, the delivery fields (`language`, `budget`, `daily_budget`, `output_formats`, `script_review`), the catalog fields, the six-level cascade, the conditional-fields table and a Removed Fields section.
  - `defaults/video-defaults_NN.md`: `parent_spec` `coNNtent_V_0-15-0`; no `budget`, no `language`; adds `image_size`, `output_formats`, `script_review`; drops `master_resolution`.
  - Blueprint `V_0-15-0`; both catalogs regenerated; `references/parameters.md` regenerated (12 scopes).
- Deviations needed to keep the tree green before the engine slices (each removed by a later slice):
  - The compiler resolves the master size from the first `output_formats` entry, keeping `master_resolution` as a legacy fallback until Slice 5.
  - `DEFAULT_CONDITIONAL_FIELDS` carries the four behaviour types; the V_0-14-x visual types live in a private `LEGACY_LAYER_FIELDS` map so pre-V_0-15-0 fixtures keep compiling until Slice 5.
  - `PRESET_PARAMETERS`: `voice_tone` out, `image_size` in. Both tables are deleted by Slice 2b in favour of the generated registry.
  - The maintainer's D5 note replaces the old `template_version`/`SHIPPED_TEMPLATE_VERSIONS` instruction, which does not apply to this repo (no such registry; `template_version` belongs to frozen blueprints).
  - Every artifact in the change folder was swept from the planned `V_1-0-0` to `V_0-15-0`.
- Verification: skill suite 420 tests, 420 pass; `node scripts/verify.js` green (230 steps); `check-openspec-deltas` green; `prettier` clean.
- Open issues: the editor's shipped-template registry lives in `cogNNitive-web`; carry it into Slice 10.

## Slice 2b — Field registry

- Branch: `feature/conntent-v1-2b` (base `feature/conntent-v1-2a`)
- PR: pending
- TDD: RED first (`test/field-registry.test.mjs`), then GREEN.
- Changes:
  - `scripts/build-field-registry.mjs`: generates `lib/field-registry.generated.json` from the blueprint through the core mirror's `parseKnowledge` (71 fields + the conditional-fields table), with `--check`, `--spec` and `--out` seams.
  - `scripts/lib/field-consumers.mjs`: three explicit buckets — real module consumers, `PLANNED_CONSUMERS` (field → the slice that will read it), and `IGNORED_BY_DESIGN` (`tags`) — plus `auditConsumers()` for the dead/phantom test.
  - `scene-compiler.mjs` and `lib/presets.mjs` now read the registry: `CONDITIONAL_FIELDS` and `PRESET_PARAMETERS` are derived, not hand-copied. The legacy visual types stay in a private `LEGACY_LAYER_FIELDS` map until Slice 5.
  - Deleted `conditional-fields-drift.test.mjs` and `preset-parameters-drift.test.mjs`; the contract test switches to `CONDITIONAL_FIELDS`.
  - `scripts/verify.js` gains the `field-registry --check` step.
- Verification: skill suite 424 tests, 424 pass; `node scripts/verify.js` green.
- Deviations: `PLANNED_CONSUMERS` keeps the dead-field gate honest while the engine is rewritten; each later slice deletes its entries. Open issues: none.

## Slice 3a — Model catalog and adapters

- Branch: `feature/conntent-v1-3a` (base `feature/conntent-v1-2b`)
- PR: pending
- TDD: RED first (`test/catalog.test.mjs`, 8 tests), then GREEN.
- Changes:
  - `catalog/model-catalog_coNNtent_NN.md`: the dated reference catalog (3 Providers, 9 Models, 2 Voices). Prices are the ones the engine carried in code before V_0-15-0, recorded with `price_date:: 2026-11-02`; the domaiNN overlay should replace them with invoice values. `infinitetalk-fast` is active and allowed.
  - `scripts/lib/catalog.mjs`: parse → merge per Model slug (overlay wins, overlay-only models must declare every field) → allowlist (`allowed:: true`, or `status:: active` with no overlay) → `resolveModel`, `assertModelAllowed` (`unknown-model`, `model-not-allowed`, `model-blocked`, `unpriced-model`), `isPriceStale`, `sizesOf`, `loadOverlay`.
  - `scripts/adapters/`: `_intent.mjs` (the one intent → provider-parameter translation) plus `minimax-speech`, `infinitetalk`, `wavespeed-image`, `replicate-image`; each Model's `adapter::` names one, and the contract test asserts adapter `controls` equal the catalog `controls`.
  - `lib/field-consumers.mjs`: the catalog fields became real consumers (3a landed), so their `PLANNED_CONSUMERS` entries are gone.
  - The catalog document is named `model-catalog_coNNtent_NN.md` to satisfy the NN name invariant for L3 documents inside a blueprint; design and tasks were updated.
- Verification: skill suite 432 tests, 432 pass; `node scripts/verify.js` green (231 steps).
- Deviations: adapters are per provider family, not one file per model id, so `adapter::` is shared by models with identical controls (the contract test still pins each Model's controls). `sizes` carries `1024x1024` only, the single size the engine has exercised; a real model offering more sizes must extend its Model entry. Open issues: none.

## Slice 3b — Estimator on the catalog, plan hash with prices, ledger v2

- Branch: `feature/conntent-v1-3b` (base `feature/conntent-v1-3a`)
- PR: pending
- TDD: RED first (`test/plan-and-facts.test.mjs`), then GREEN.
- Changes:
  - `asset-cost-estimator.mjs`: the hand price table (`PROVIDER_PRICING_CATALOG`) is deleted; `findCatalogEntry`, `estimateCallUsd` and `unpricedAllowedModels` read the merged catalog through `lib/catalog.mjs`. An allowed model without a catalog price now blocks the estimate with `unpriced-model` (no fallback rate), and `plan_hash` includes the resolved unit prices.
  - `lib/plan-approval.mjs`: `computePlanHash(script, models, prices)` — a price change invalidates an approval.
  - `lib/facts.mjs`: canonical JSON, `machineInfo`/`fingerprintOf`/`verifyFingerprint` (first 12 hex of sha256 over the canonical machine object), the v2 ledger row with every required key plus `machine`, the v1 timing row, append-only writers under `.cognnitive/video/`, and a timing write that only warns.
  - `scripts/guard-template-immutability.js`: `catalog/` is exempt from the template rules and is owned by the blueprint spec, like `defaults/` (the shipped catalog is an L3 instance, not a template).
- Falsified the fallback: `estimateCallUsd` still prices a model the guard does not allow (needed by synthesizer-level tests), while `estimateScriptCost` refuses a resolved model that is allowed but unpriced. The full no-fallback rule lands with the guard rewrite in 7a.
- Verification: skill suite 438 tests, 438 pass; `node scripts/verify.js` green (232 steps).
- Deviations: `video-guard.json` is NOT deleted here (its allowlist still drives the guard until `produce` lands in 7a); recorded in tasks 3b.2. Stale-price *warning* is not printed yet: `isPriceStale` and `price_date` are in place, the warning line lands with the plan output in 7a. Open issues: none.

## Batch 4+5+6 — in flight on `feature/conntent-v1-4` (one PR at the end)

Per maintainer decision (option 1): slices 4, 5 and 6 accumulate on one branch and open a single PR
when all three are complete.

Landed and verified so far (each commit ran the full `verify.js`):

- **4 / part 1** (`f83c750c`): `kind` level in the cascade between `series` and `video`; `kind` may
  expand `presets`; new `lib/kinds.mjs` (series grammar from the Series document, `kindBagOf`,
  `chromeFieldsFor`, `validateSceneKinds`, `validateLanguage`); a V_0-15-0 document requires a known
  `kind::` (or `Libre`) on every scene and a resolved `language`, legacy documents stay exempt.
  Cascade proof: a kind preset beats `series` and loses to `video`.
- **5 / part 2** (`5e53530a`): `image_size` is part of the image cache key; the master is named
  `<slug>_<W>x<H>.mp4` from the manifest size instead of a literal `1920x1920`.
- **6 / part 3** (`5a235f16`): `renderVideo` appends `compile` and `render` timing rows when given a
  `facts` context (plan hash, episode, link mode, frames/fps/resolution, cache counts, machine fp).
- **5 / part 4** (`8d1a596b`): `assertImageSize` refuses an `image_size` the resolved model does not
  declare (`unsupported-size`), before any spend.

- **4 / part 6** (`61225221`): the `cli` cascade level is gone from `SCOPE_ORDER` and
  `bagsToChain` (a `cli` bag is ignored). `--image-model`, `--tts-model` and `--avatar-model` are
  refused by `video-engine-cli`, `asset-cost-estimator` and `synthesize-avatar`, as
  `video-script-model` "There is no cli level" requires. Model ids resolve once per run from the
  documents, so the estimator, compile and synthesize-avatar share one `plan_hash` and one cache
  key; a cascaded TTS model equal to the scene's own no longer forks the key.
- **5 / part 7**: `lib/stage-assets.mjs` (`linkOrCopy`, `assetName`, `resolveGsapPath`,
  `assertGsapPresent`). Staged assets are hardlinks to the provider cache; `EXDEV`/`EPERM`/
  `ENOTSUP` falls back to a clone-on-write copy, records `link_mode: copy` and warns once. The
  engine project now lives in `<episode>/hyperframes/` (`manifest.json`, `index.html`,
  `compositions/`, `assets/`, `vendor/`): no `build/`, no `public/`, no `audio/`, the manifest at
  `hyperframes/manifest.json` and the temp render file inside that folder. An authored
  `Hyperframes/` folder is a named collision error before anything is written. `gsap` is pinned
  exactly (`3.14.2`), `ensure-hyperframes --check` reports it, emission copies it to
  `vendor/gsap.min.js` and the project references it (a missing install fails loudly, no network
  URL anywhere). Copy mode deletes `hyperframes/assets/` after a successful render. `image_size`
  is validated against the merged catalog (`sizes`, overlay included) by both the estimate and
  the compile, and is now a real field consumer.

**Link-vs-copy spike (hard stop): PASSED.** Rendered the same two-scene episode twice with the
real pinned HyperFrames CLI (`0.8.192`): run 1 `link_mode=link`, run 2 forced `EXDEV` →
`link_mode=copy` (assets staged again from scratch, one warning, `hyperframes/assets/` deleted
after the render). Both masters are byte-identical:
`sha256 3c2b45ab…7c9cfbef7`, 28,466 bytes, `spike_1920x1920.mp4`. Harness:
`temp/spike-link-vs-copy.mjs` (gitignored scratch, not committed).

- **6 / part 8**: per-stage timing hooks. `synthesizeScriptAssets` measures the `tts` and
  `image` windows (wall clock, calls, cache hits/misses) and `compileVideo` queues the
  `tts`/`image`/`avatar` rows until the staging mode is known, so every row carries the real
  `link_mode`; the rows land in the fixed order `tts`, `image`, `avatar`, `compile`, `render`.

All three slices of the batch are closed. The batch is ready for its single PR.

Verification at the batch tip: skill suite 467 tests, 467 pass; `node scripts/verify.js` green;
nothing merged to `dev`/`main`; no tag; `video_NN` untouched.
