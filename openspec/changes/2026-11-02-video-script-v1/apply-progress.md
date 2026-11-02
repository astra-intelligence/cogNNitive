# Apply progress: coNNtent redesign (`2026-11-02-video-script-v1`)

Append-only per-slice log. Merge new entries into this file; never overwrite it.

Chain: tracker `feature/conntent-v1` (cut from `origin/dev`, with `origin/session/video-redesign` merged).
Every slice branch is `feature/conntent-v1-<slice>`; the first PR targets the tracker, each later PR
targets the previous slice's branch. Nothing merges into `dev` or `main` from this chain.

## Slice D — Align OpenSpec artifacts with the resolved decisions (docs-only)

- Branch: `feature/conntent-v1-d` (base `feature/conntent-v1`)
- PR: pending
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
- Open issues: none. No test code changes in this slice (docs-only), so no RED/GREEN cycle applies.
