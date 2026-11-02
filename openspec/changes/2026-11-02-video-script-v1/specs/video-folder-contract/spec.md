# Delta for video-folder-contract

Change `2026-11-02-video-script-v1`. Decision D8 (folder contract) and D7 (old episodes and archive series stay untouched). The engine project folder name is fixed by design.md and written below as `<project>`.

## ADDED Requirements

### Requirement: One Master Per Episode

An episode folder MUST hold at most one master file `<slug>_<W>x<H>.mp4`. A new render MUST replace it atomically, and no tool MUST keep renders of earlier runs, variants of the master or a copy of it outside the derived formats.

Source: D8.

#### Scenario: Re-render replaces the master

- GIVEN an episode with a master and a successful re-render
- WHEN the folder is listed
- THEN exactly one master exists and it is the new one

#### Scenario: No root renders folder

- GIVEN a produced episode
- WHEN the series and domain roots are searched for a copy of its master
- THEN none is found

### Requirement: Duplicate Cleanup Deletes Only Cached Bytes

The cleanup of duplicates in an active series MUST delete a file only when its exact bytes (by content hash) exist in the provider cache, MUST report each deleted and each kept file, and MUST be run for the pilot series only as part of the pilot. It MUST NOT touch the `inntrevistas` and `cosicah` folders, including their `public/` folders.

Source: D7, D8.

#### Scenario: Cached duplicate is deleted

- GIVEN a hash-named file in an episode whose bytes equal a cache entry
- WHEN the cleanup runs
- THEN the file is deleted and the cache entry is untouched

#### Scenario: Uncached file is kept

- GIVEN a file whose bytes are in no cache entry
- WHEN the cleanup runs
- THEN the file is kept and reported

#### Scenario: Archive series are untouched

- GIVEN the `inntrevistas` and `cosicah` series
- WHEN the cleanup runs
- THEN no file under them is read for deletion or modified

## MODIFIED Requirements

### Requirement: Three-Level Asset Scoping

Assets MUST be scoped at exactly three levels: domain (shared across all series, at the domain root), series (shared across the episodes of one series, in `series/<s>/shared/<kind>/`, `series/<s>/sounds/`, `series/<s>/components/` and `series/<s>/frames/`), and episode (owned by one video, in `series/<s>/episodes/<slug>/`).
(Previously: the episode level was `series/<s>/assets/<slug>/`.)

Source: D1, D8.

#### Scenario: Episode-owned files resolve inside the episode folder

- GIVEN a Video in Series `X`
- WHEN its `script`, `thumbnail` and `master` fields are resolved
- THEN all three resolve to files inside that episode's own folder under Series `X`

#### Scenario: Series shared asset is found at the series level

- GIVEN `series/X/shared/audio/intro.mp3` and a script in an episode of `X` referencing it by that relative path
- WHEN the folder-contract check runs
- THEN the reference is accepted

### Requirement: Ephemeral Engine Directories Are Not Artifacts

The engine project folder `<project>` inside an episode folder and `.cognnitive/cache/` at the domain root MUST be gitignored and MUST NOT be treated as iNNfo Artifacts. They hold regenerable engine output, not workspace-owned deliverables.
(Previously: `build/`, `draft_thumbs/` and `.cognnitive/cache/`.)

Source: D2, D8.

#### Scenario: Engine directories excluded from artifact discovery

- GIVEN an episode folder containing `<project>`
- WHEN artifact/manifest discovery runs
- THEN neither the directory nor its contents are treated as candidate Artifacts

### Requirement: Canonical Domain, Series And Episode Layout

Every video domain MUST use one layout: the domain root holds at least `domaiNN_NN.md`, `video-defaults_NN.md`, `video-guard.json`, `.gitignore` and `.cognnitive/`, MAY hold `sounds/`, `components/`, `frames/`, `procedures/`, `assets/<library>/`, the domaiNN catalog document, the ledger and the timing log, and any other domaiNN content, and MUST NOT hold engine output; each series at `series/<s>/` holds its scope document `<s>_scope_NN.md` plus optional `shared/<kind>/`, `sounds/`, `components/`, `frames/`, `procedures/`, and its episodes at `series/<s>/episodes/<slug>/`.
(Previously: episodes lived at `series/<s>/assets/<slug>/`.)

Source: D1, D8.

An episode folder `E` MUST contain `<slug>_video-script_<s>_NN.md`, `media/`, `animations/<project>/`, `asset_plan.md`, `asset_plan.approved.json`, `description.md`, the deliverables of "Deliverables Are Written In Place" and the engine project `<project>/`, each optional until its producing step has run. `E` MUST NOT contain `build/`, `public/`, `draft.json`, `reviewed.json` or `review_console.html`. Episodes authored before V_1-0-0 stay where they are as an archive and are not required to match this layout.

#### Scenario: Fully produced episode matches the layout

- GIVEN an episode that has completed `produce`
- WHEN its folder is listed
- THEN every entry is named in the canonical layout and every engine-generated file is under `<project>/`

#### Scenario: No build directory

- GIVEN a produced episode
- WHEN its folder is listed
- THEN no `build/` or `public/` directory exists

#### Scenario: Series anchor is the only series file required

- GIVEN a series folder holding only `<s>_scope_NN.md`
- WHEN the layout is checked
- THEN the series is valid and no `series_NN.md`, `series_rules.md`, `script_template.md` or `video.series.json` is required

#### Scenario: Old episodes are not moved

- GIVEN a pre-V_1-0-0 episode at `series/<s>/assets/<slug>/`
- WHEN the layout is checked
- THEN it is reported as archive and no tool moves it

### Requirement: Naming Scheme By File Class

File and folder names MUST follow one scheme by class: domain-indexed documents (`_NN.md`) are `<stem>_<blueprint-or-role>_NN.md` with a domain-unique kebab-case stem, working files inside `E` carry fixed `snake_case` role names with neither slug nor `V_`, deliverables that leave `E` are `<slug>_<what?>_<W>x<H>.<ext>` named by true dimensions, and `description.md` carries no slug and no `V_`.
(Previously: the working-file scenario listed `draft.json`, `reviewed.json` and `review_console.html`.)

Source: D1.

The episode script MUST keep the name `<slug>_video-script_<s>_NN.md` because it is a domain-indexed document and stems must be unique. Folders MUST be lowercase, plural when they hold many items (`episodes`, `assets`, `sounds`, `components`, `frames`, `animations`, `procedures`) and singular for mass nouns (`media`, `shared`). Every file and folder name MUST be English. Authored `Hyperframes/` folders are tolerated and are not renamed; new episodes use `animations/`.

#### Scenario: Deliverable name carries slug and true dimensions

- GIVEN episode slug `startup-founder` and a vertical derivation
- WHEN the output is written
- THEN its name is `startup-founder_1080x1920.mp4`

#### Scenario: Working files carry no slug or version

- GIVEN a freshly produced episode
- WHEN `asset_plan.md`, `asset_plan.approved.json` and `description.md` are inspected
- THEN none of their names contains the slug or a `V_x-y-z` tag

#### Scenario: Script keeps its domain-indexed name

- GIVEN episode `startup-founder` in series `cognitive-use-cases`
- WHEN the script is written
- THEN its name is `startup-founder_video-script_cognitive-use-cases_NN.md`

#### Scenario: Spanish names are reported, not renamed

- GIVEN a real-domain procedure file with a Spanish name
- WHEN the canonical layout is applied to a new episode
- THEN the existing file keeps its name and the contract states that new names are English

### Requirement: Deliverables Are Written In Place

Render and `produce` MUST write every deliverable directly at its final path in `E`, with no promotion step and no copy out of a staging folder: the master `<slug>_<W>x<H>.mp4`, the derived formats `<slug>_<W>x<H>.mp4` declared by `output_formats` (blur variants carry `_blur` before the extension), and the thumbnails `<slug>_thumbnail_<W>x<H>.png`.
(Previously: the master was `<slug>_1920x1920.mp4` and the derived formats were the three fixed ones.)

Source: D1, D5 (settled default 1).

The Video element fields `master` and `thumbnail` MUST hold the bare file names of the master and the 2560x1440 thumbnail. A `Video` element MUST NOT carry a field for a derived format.

#### Scenario: Master is written at its final path

- GIVEN a successful `render`
- WHEN `E` is listed
- THEN `<slug>_<W>x<H>.mp4` exists in `E`
- AND no temporary render file remains and no other copy of the master exists

#### Scenario: Fields name the deliverables

- GIVEN a produced episode
- WHEN the Video record is read
- THEN `master` is the master file name and `thumbnail` is `<slug>_thumbnail_2560x1440.png`

### Requirement: Managed Gitignore Block

The domain `.gitignore` MUST contain the managed block `**/<project>/` and `.cognnitive/cache/`, and `audio/` MUST NOT be ignored because real episodes hold authored audio there.
(Previously: the block was `**/build/`, `**/draft_thumbs/` and `.cognnitive/cache/`.)

Source: D2.

#### Scenario: Block ignores engine output

- GIVEN a domain `.gitignore` with the managed block
- WHEN `git check-ignore` is run for `series/s/episodes/e/<project>/index.html`
- THEN it is ignored

#### Scenario: Authored audio is not ignored

- GIVEN `series/s/episodes/e/audio/00_hook.wav`
- WHEN `git check-ignore` is run for it
- THEN it is not ignored

### Requirement: Authored And Engine-Generated Files Are Distinct

The contract MUST classify each episode entry as authored and tracked (scope document, script, `asset_plan.md`, `asset_plan.approved.json`, `media/`, `animations/`, `description.md`), tool-written and tracked in place (the deliverables of "Deliverables Are Written In Place"), or generated and gitignored (`<project>/`, `.cognnitive/cache/`).
(Previously: the classification listed `draft.json`, `reviewed.json`, `review_console.html`, `build/` and `draft_thumbs/`.)

Source: D1, D2.

#### Scenario: Classes are exhaustive

- GIVEN a produced episode folder
- WHEN each entry is looked up in the classification
- THEN every entry has exactly one class

## REMOVED Requirements

### Requirement: Engine Output Lives Only Under build/

(Reason: D8 removes the separate `build/` directory; the HyperFrames project lives in the episode folder and links its assets to the cache. See cognnitive-video-engine "Engine Project Lives In The Episode Folder".)
(Migration: engine output lives under `<project>/`; `asset_plan.approved.json` remains a tracked governance file in `E`.)
