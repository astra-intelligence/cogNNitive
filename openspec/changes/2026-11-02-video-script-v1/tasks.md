# Tasks: video-script V_1-0-0 (decision-in redesign)

Skill root `S` = `iNNfo/specs/bluepriNNts/video-script/skills/nn-video-script`. Tests live in `S/test` (`node --test`). Strict TDD: every slice lists RED (failing test) before GREEN (code) before REFACTOR. All slices land on `dev` as one PR each; nothing is committed by this phase.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | about 5,500 total (see per-slice estimates); generated bundles and the `spec_NN.md` text excluded from review weight |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 0a, 0b, 1, 2a, 2b, 3a, 3b, 4, 5, 6, 7a, 7b, 8, 9, 10 (Slice 11 is external) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Est. lines | Likely PR | Notes |
|------|------|-----------|-----------|-------|
| 0a | QW1 image cache key, QW5 `--fill crop`, QW3 avatar render refusal | 150 | PR 0a | Independent; V_0-14-x. Base: main or tracker |
| 0b | QW2 remove non-preset console controls, QW4 unpriced warning | 120 | PR 0b | Independent of 0a |
| 1 | Mirror target `video-script` | 300 | PR 1 | Needs 0a/0b merged; generated bundle excluded |
| 2a | `spec_NN.md` V_1-0-0 text | 600 | PR 2a | Docs-only, likely `size:exception` |
| 2b | Field registry generator, validator, consumers | 450 | PR 2b | Depends on 2a |
| 3a | Catalog doc, `catalog.mjs`, adapters | 450 | PR 3a | Depends on 2b |
| 3b | Estimator rewrite, `plan_hash`, ledger v2, delete guard JSON | 400 | PR 3b | Depends on 3a |
| 4 | Series kinds/chrome, `cascade.mjs`, language | 450 | PR 4 | Depends on 2b; parallel with 3a/3b in theory, single writer in practice |
| 5 | `stage-assets`, episode-folder project, GSAP vendor, `image_size`, spike | 500 | PR 5 | Depends on 3b, 4 |
| 6 | Timings log, fingerprint | 200 | PR 6 | Depends on 5 |
| 7a | `produce` state machine core, exit codes, engine changesets | 450 | PR 7a | Depends on 3b-6 |
| 7b | Delete old CLIs and drift tests, resume tests | 350 | PR 7b | Depends on 7a |
| 8 | Exporter `.data.mjs` hook, Episode review view | 500 | PR 8 | Depends on 7b |
| 9 | Series view | 350 | PR 9 | Depends on 8 |
| 10 | Draft procedure, SKILL.md, references | 350 | PR 10 | Depends on 7b; may run beside 8/9 |
| 11 | Pilot port, external | n/a | none | Maintainer-run, outside repo |

Each PR states start, end, prior dependency, follow-up and out-of-scope in its Chain Context, with a diagram marking the current PR. Rollback boundary for every slice: revert that PR alone; later slices are not merged until the earlier ones are verified.

## Pre-apply maintainer decisions

| # | Decision | Blocks |
|---|----------|--------|
| 1 | Layer type set: keep 10 or reduce to the 8 used (`brand`, `quote` unused) | 2a |
| 2 | Meaning of `for:: narration` (the scene body) on `Variant` | 2a, 8 |
| 3 | `budget` default (spec says 0 = always ask) and `language` default `en` | 2a, 4 |
| 4 | Series chrome media folder: `series/<s>/assets/` vs `shared/<kind>/` | 2a, 4 |
| 5 | Episode document name `<slug>_NN.md` vs the domaiNN-unique stem naming rule | 2a, 7a |
| 6 | Are `.cognnitive/video/` facts gitignored, and how do multi-machine facts reach the console | 3b, 6, 9 |
| 7 | Produce writing Chapters into `description.md` | 10 |
| 8 | Block `infinitetalk` (`status:: blocked`) or keep active with a warning | 0b, 3a |

Also confirm the design's open items: A12 (generic `.data.mjs` hook, blocks 8), A4 (applied draft under `status:: draft`, blocks 7a), A6 (video-level beats kind-level, blocks 4), A10 (bundle size, measured in 1), `daily_budget` scope (blocks 3b).

## Slice 0a: Quick wins on the engine (V_0-14-x)

- [ ] 0a.1 RED: test in `S/test` that the image cache key changes with cascade `image_model` and ignores display `title` (`lib/image-options.mjs`).
- [ ] 0a.2 GREEN: fix the key in `S/scripts/lib/image-options.mjs`; note the one-time re-bill in the release note.
- [ ] 0a.3 RED then GREEN: `render-formats.mjs --fill crop` produces a cropped output (test on a fixture clip).
- [ ] 0a.4 RED then GREEN: render refuses missing avatar clips (`lib/avatar-jobs.mjs:164-181`), per "Render Refuses Missing Avatar Clips".
- [ ] Verify: `node --test S/test` and `node scripts/verify.js`.

## Slice 0b: Quick wins on console and guard

- [ ] 0b.1 RED: test that `draft-template.html` exposes only preset controls.
- [ ] 0b.2 GREEN: remove non-preset controls from `S/scripts/draft-template.html`.
- [ ] 0b.3 RED then GREEN: allowed model without price emits a warning in `asset-cost-estimator.mjs`. Apply decision 8 for `infinitetalk`.
- [ ] Verify: as 0a.

## Slice 1: Core mirror target

- [ ] 1.1 RED: `build-core-mirrors.mjs --check` test expects target `video-script` and `lib/nn-core.generated.cjs` exports (scope fold, `parseKnowledge`, `parseChangeset`, `serializeChangeset`, `computeProposalSha`, `executeChangesetApply`, `writeProposedChangeset`).
- [ ] 1.2 GREEN: create `scripts/core-mirrors/video-script.ts`; edit `scripts/build-core-mirrors.mjs` (replaces `scope` target); regenerate.
- [ ] 1.3 Replace `S/scripts/lib/knowledge-model.mjs` imports; its tests stay green.
- [ ] 1.4 Measure bundle size and record it (design A10).
- [ ] Verify: `node scripts/build-core-mirrors.mjs --check`, `node scripts/verify.js`.

## Slice 2a: Spec V_1-0-0 text

- [ ] 2a.1 Resolve decisions 1-5, then edit `iNNfo/specs/bluepriNNts/video-script/spec_NN.md`: Scene Kind, Chrome, Variant, new and removed fields, `blueprint_version: V_1-0-0`. Never edit a published `_V_x-y-z_` file.
- [ ] 2a.2 Bump `template_version` and register it in the editor's `SHIPPED_TEMPLATE_VERSIONS`; keep `manifest/source.yaml` `version:` on the spec axis.
- [ ] 2a.3 Sync `openspec/specs/` deltas only at archive time, not here.
- [ ] Verify: `node scripts/verify.js`, `check:spec-urls`.

## Slice 2b: Field registry

- [ ] 2b.1 RED: tests for `build-field-registry.mjs` generation, `--check` freshness, unknown and retired key rejection, field-to-consumer contract (`lib/field-consumers.mjs`).
- [ ] 2b.2 GREEN: create `S/scripts/build-field-registry.mjs`, `lib/field-registry.generated.json`, `lib/field-consumers.mjs`.
- [ ] 2b.3 Delete `conditional-fields-drift`, `preset-parameters-drift` tests; remove `PRESET_PARAMETERS`, `DEFAULT_CONDITIONAL_FIELDS`.
- [ ] 2b.4 Add `--check` step to `scripts/verify.js`.
- [ ] Verify: registry `--check`, `node --test S/test`, `node scripts/verify.js`.

## Slice 3a: Model catalog and adapters

- [ ] 3a.1 RED: tests for catalog merge (overlay wins per slug), allowlist, unknown model failure, adapter `controls` equal catalog `controls`, adapter `translate`.
- [ ] 3a.2 GREEN: create `.../video-script/catalog/model-catalog_NN.md`, `S/scripts/lib/catalog.mjs`, `S/scripts/adapters/*.mjs`.
- [ ] Verify: `node --test S/test`.

## Slice 3b: Estimator, plan hash, ledger v2

- [ ] 3b.1 RED: golden `plan_hash` (changes with price), stale-price warning, unpriced-allowed blocks, ledger v2 row schema, real cost per episode.
- [ ] 3b.2 GREEN: `lib/plan.mjs`, `lib/facts.mjs`; rewrite estimator on the catalog; delete `video-guard.json` and `PROVIDER_PRICING_CATALOG`. Apply decision 6.
- [ ] Verify: `node --test S/test`, `node scripts/verify.js`.

## Slice 4: Series kinds, chrome, cascade

- [ ] 4.1 RED: cascade order blueprint, domain, series, kind, video, scene; kind presets; fixed scenes; `Libre`; chrome per language; kind rule enforcement.
- [ ] 4.2 GREEN: `lib/cascade.mjs`, `lib/kinds.mjs`; delete the `cli` level; delete `lib/video-scope.mjs`. Apply decisions 3, 4 and A6.
- [ ] Verify: `node --test S/test`.

## Slice 5: Staging and project layout

- [ ] 5.1 RED: `linkOrCopy` with injected `EXDEV`, `nlink >= 2`, no write-open of staged assets, no `build/`, master named `<slug>_<W>x<H>.mp4`, `image_size` in cache key and catalog `sizes`, missing GSAP fails loudly.
- [ ] 5.2 GREEN: `lib/stage-assets.mjs`; modify `scene-project.mjs`, `hyperframes-render.mjs`, `cache-manager.mjs` (read-only cache files), `ensure-hyperframes.mjs`; pin `gsap` exactly.
- [ ] 5.3 Manual spike: render the pilot in link and forced-copy modes; masters must be byte-identical. Record in apply-progress.
- [ ] Verify: `node --test S/test`.

## Slice 6: Timings

- [ ] 6.1 RED: timing row schema, fingerprint (first 12 hex of sha256 of `machine` without `fp`), write failure does not stop a run.
- [ ] 6.2 GREEN: timings in `lib/facts.mjs`, stage hooks in `lib/compile.mjs`, `lib/render.mjs`.

## Slice 7a: `produce` core

- [ ] 7a.1 RED: integration tests on a tmp domaiNN with injected synthesizer and `hyperframesRun`: every transition, exit codes 0/10/11/1, intake dry-apply, skip never bypasses budget, resume, refusal of non-V_1 episodes.
- [ ] 7a.2 GREEN: `S/scripts/produce.mjs`, `lib/episode.mjs`, `lib/changes.mjs` (engine changesets via `writeProposedChangeset` and `executeChangesetApply`). Apply decision 5.

## Slice 7b: Remove old pipeline

- [ ] 7b.1 Delete `video-engine-cli`, `build-script-from-draft`, `build-draft-html`, `draft-template.html`, `finalize-video`, `approve-plan`, `lib/legacy-draft-keys.mjs` and their tests.
- [ ] 7b.2 Delete standalone CLIs of `synthesize-avatar.mjs` and `tts-generator.mjs` unless a test needs them.
- [ ] Verify: `node --test S/test`, `node scripts/verify.js`.

## Slice 8: Exporter hook and Episode review view

- [ ] 8.1 RED (jsdom pragma): view mounts via `registerView`, emits `update_field` and `comment`, reads `ctx.viewData`, export under 5 MB; exporter test for `.data.mjs` `collect`.
- [ ] 8.2 GREEN: `scripts/export-console.mjs` hook; `.../assets/console-view-episode-review.js` and `.data.mjs`. Needs A12 confirmed.

## Slice 9: Series view

- [ ] 9.1 RED (jsdom): cost and timings from JSONL, stale-price warning, computed index.
- [ ] 9.2 GREEN: `console-view-series.js` and `.data.mjs`.

## Slice 10: Draft procedure and docs

- [ ] 10.1 Draft procedure under `.../video-script/procedures/` emitting a sealed changeset P; apply decision 7.
- [ ] 10.2 Update `S/SKILL.md`, `references/{folder-contract,parameters,cost-guardrails}.md`; add `prune-duplicates.mjs --dry-run` with a test that only cache-identical bytes qualify.

## Slice 11: Pilot port (manual, maintainer-run, outside the repo)

Target: `D:\Users\lucas\Documents\_NN\video_NN`.

- [ ] 11.1 Port cognitive-use-cases by hand (Series with kinds and chrome, Episode docs). Run `produce` from `idea` to `produced`; check success criteria.
- [ ] 11.2 Run `prune-duplicates.mjs --dry-run`, review the list, then delete only files whose exact bytes exist in `.cognnitive/cache`.
- [ ] 11.3 Never touch inntrevistas or cosicah `public/`.
- [ ] 11.4 After pilot acceptance, port villabotijos-today, then innteresante.
- [ ] 11.5 Keep pre-port files until the pilot is accepted (rollback).
