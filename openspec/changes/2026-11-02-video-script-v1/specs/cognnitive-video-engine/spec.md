# Delta for cognnitive-video-engine

Change `2026-11-02-video-script-v1`. Requirements marked `Slice: 0` ship first on the V_0-14-x line, before the V_1-0-0 redesign. Disposition of the Slice 0 requirements:

| Slice 0 item | Requirement | Disposition at V_1-0-0 |
|---|---|---|
| 1 image cache key | Cache Identity Image Options Never Gain Size | durable |
| 3 avatar clip refusal | Render Refuses Missing Avatar Clips | durable |
| 4 unpriced models | Allowed Models Must Be Priced | interim, superseded by video-model-catalog "Unpriced Or Unknown Models Fail Loudly" (drop at archive of slice 1) |
| 4 infinitetalk | video-model-catalog "Blocked Models Are Not Allowlisted (pending Q7)" | durable once confirmed |
| 5 crop fill | Blur Fill Is Opt-In And Suffixed | durable |
| 2 console controls | video-console-views "No Control Without Effect" | durable |

## ADDED Requirements

### Requirement: Allowed Models Must Be Priced

The engine MUST emit one warning per allowed model that has no price in the price catalog, naming the model, at the start of every run that loads the guard. The run MUST continue.

Slice: 0 (V_0-14-x, interim).

#### Scenario: Unpriced allowed model warns

- GIVEN an allowed model id with no price entry
- WHEN a run loads the guard
- THEN exactly one warning names that model and the run is not stopped

#### Scenario: Fully priced allowlist is silent

- GIVEN every allowed model has a price
- WHEN a run loads the guard
- THEN no pricing warning is emitted

### Requirement: Master Size Comes From output_formats

The compiler MUST take the master pixel size from the `master` entry of the cascaded `output_formats` parsed as `^(\d+)x(\d+)$`, MUST emit a manifest whose width and height are that size, and MUST fail before any spend with `unsupported-master-resolution` when the entry is missing or does not match. Engine code MUST NOT default a width, height or orientation, and the master file name MUST be `<slug>_<W>x<H>.mp4` from that size. `isHorizontal` and the `center 12%` headroom MUST NOT exist.

Source: D4 and exploration §4 (master size from the declared field).

#### Scenario: Manifest takes the declared size

- GIVEN the package default `output_formats` with `master=1920x1920`
- WHEN a script is compiled
- THEN the manifest width and height are 1920 and 1920 and the master is named `<slug>_1920x1920.mp4`

#### Scenario: Another declared size

- GIVEN a Series declaring `output_formats:: [master=1280x1280]`
- WHEN a script is compiled
- THEN the manifest is 1280 by 1280 and the master is named `<slug>_1280x1280.mp4`

#### Scenario: Malformed value stops before spend

- GIVEN `output_formats:: [master=wide]`
- WHEN `compile` runs
- THEN it fails with `unsupported-master-resolution`
- AND no provider request is made and no ledger entry is written

#### Scenario: Project emission requires the size

- GIVEN a manifest without width or height
- WHEN the project is emitted
- THEN emission fails with a named error and does not assume 1920x1080

### Requirement: Delivery Formats Come From output_formats

The format step MUST derive exactly the formats declared by the entries of the cascaded `output_formats` other than `master`, named `<slug>_<W>x<H>.mp4`. For the default square master the derivation rules of "Delivery Formats Are Derived From The Master By Crop" apply unchanged. The crop geometry for a different master size is fixed by design.

#### Scenario: Only declared formats are derived

- GIVEN `output_formats:: [master=1920x1920, vertical=1080x1920]`
- WHEN the format step runs
- THEN only `<slug>_1080x1920.mp4` is written

#### Scenario: Default set

- GIVEN the package default `output_formats`
- WHEN the format step runs
- THEN the three default derived files are written

### Requirement: Assets Are Linked, Not Copied

The engine MUST make provider cache assets available to the HyperFrames project as hardlinks to the cache entries, and MUST NOT copy them under content-addressed names (`stageAsset` copies). After a produce run no hash-named duplicate of a cache entry MUST remain in the episode folder. When a hardlink cannot be created (for example across volumes) the engine MUST apply the fallback fixed by design (Q1) and MUST report which mechanism was used; it MUST NOT fall back silently to permanent copies.

Source: D8.

#### Scenario: Staged asset is a link

- GIVEN a synthesized narration in the cache
- WHEN the project is emitted
- THEN the project's asset and the cache entry are the same file on disk

#### Scenario: No hash-named copies remain

- GIVEN a completed `produce` run
- WHEN the episode folder is listed
- THEN no file named `<base>_<sha12>` duplicates a cache entry

#### Scenario: Link failure is reported

- GIVEN a cache on another volume than the episode
- WHEN the project is emitted
- THEN the report names the fallback used and the run does not leave permanent duplicates

### Requirement: Engine Project Lives In The Episode Folder

The engine MUST write its manifest and HyperFrames project inside the episode folder, under names fixed by design, and MUST NOT create a `build/` directory, a `public/` directory or an `audio/` handoff. The `--output` and `--out` options MUST NOT exist.

Source: D8.

#### Scenario: No build directory

- GIVEN a clean episode
- WHEN `produce` completes
- THEN no `build/` or `public/` directory exists in the episode folder

#### Scenario: Output option is refused

- GIVEN the engine CLI
- WHEN `compile` is run with `--output out.json`
- THEN it exits non-zero with a usage that does not list the option

### Requirement: Render Is Hermetic

The emitted project MUST NOT load GSAP or any other script, font or asset from a network URL at render time. GSAP MUST be vendored with the project or the skill, with a pinned version; the mechanism is fixed by design (Q6).

#### Scenario: No network at render

- GIVEN an emitted project
- WHEN its files are searched for `http://` and `https://` script sources
- THEN none is found

#### Scenario: Offline render

- GIVEN a host with no network and a full cache
- WHEN the render stage runs
- THEN it succeeds

## MODIFIED Requirements

### Requirement: Headless Video Rendering CLI

The system MUST provide headless CLI commands that emit a HyperFrames project from the manifest and invoke the HyperFrames renderer to produce the MP4 master of the declared size, reporting the exact total duration and frame metrics. The renderer MUST render through HyperFrames only; FFmpeg-from-PATH is not the master compositor (it only derives delivery formats from the master); and a mock MP4 MUST NOT masquerade as a render (an explicit `--allow-mock` opt-in is the only exception, and it is reserved for CI). A HyperFrames failure is a loud, named, non-zero error.
(Previously: the master was fixed at 1920x1920.)

Source: D2, D3.

#### Scenario: Headless CLI renders MP4 master via HyperFrames

- GIVEN an approved script and synthesized assets
- WHEN `render <script>` is executed
- THEN it emits the HyperFrames project and renders it to `<slug>_<W>x<H>.mp4` of the declared master size
- AND it logs total rendered frames and execution time

#### Scenario: Total duration calculation and validation

- GIVEN a completed render job
- WHEN the CLI outputs the render summary
- THEN the reported total duration matches the root `data-duration` derived from the scene sequence timings

#### Scenario: HyperFrames failure is loud, never a silent mock

- GIVEN a render where the HyperFrames CLI is unavailable
- WHEN the render CLI runs without `--allow-mock`
- THEN it fails with a named, non-zero error
- AND it never writes a mock MP4 in its place

### Requirement: Interactive Provider Consultation and Cost Estimation

The system MUST provide an asset cost estimator (`asset-cost-estimator.mjs`). Prior to asset synthesis, the engine MUST calculate per-scene character counts, image layer requirements, unit pricing for selected image and voiceover providers, and present an itemized per-scene and total budget estimation table. Every model id the estimator uses MUST come from the single Model Selection Cascade resolver, with Presets expanded, and every price MUST come from the merged model catalog (capability `video-model-catalog`); the estimator MUST NOT pick a model from a hardcoded default outside that resolver, MUST NOT hold a price table of its own, and MUST report the scope each resolved model came from and the source and date of each price.
(Previously: the estimator held a provider pricing catalog and reported no price provenance.)

#### Scenario: Script parsed and estimated by scene

- GIVEN a validated video script
- WHEN `asset-cost-estimator.mjs` is executed
- THEN it outputs an itemized table with per-scene durations, image counts, character counts, unit rates, and grand total in the domaiNN currency
- AND each model id used is reported with the scope that supplied it and each price with its source and date

#### Scenario: The cascade is the only selector

- GIVEN a script with a video-level `presets::` list whose Preset sets `voice_model`
- WHEN the estimator resolves the TTS/image models
- THEN it uses the cascade and never a bare hardcoded default
- AND the reported scope is `video:preset:<Name>`

#### Scenario: Prices come from the catalog

- GIVEN a domaiNN price override for the resolved TTS model
- WHEN the estimate is built
- THEN the unit rate is the override and the line reports source `domain`

### Requirement: In-Dir and Out-of-Dir Asset Resolution

The system MUST resolve every media reference emitted by the compiler — `layer_asset_source` and audio `assetPath` — against the **script directory**, not the current working directory, so that both in-directory (`assets/…`) and out-of-directory (`../shared/…`) sources resolve. Each resolved asset MUST be made available to the emitted HyperFrames project by a link or the design-defined fallback of "Assets Are Linked, Not Copied", and the project MUST reference it by its project-relative name. A referenced asset that cannot be resolved MUST fail loudly: the system MUST NOT silently drop the layer, substitute a mock, or emit a color-only frame in its place.
(Previously: each asset was staged by copying it into the project `assets/` directory.)

#### Scenario: Out-of-directory asset is linked and served

- GIVEN a script whose layer references `../shared/intro_creadores.mp4`, outside the video folder
- WHEN the script is compiled and rendered
- THEN the asset is made available to the project by link or the defined fallback
- AND the project references it by its project-relative name
- AND the render succeeds with no 404 for the asset

#### Scenario: Missing asset fails loudly

- GIVEN a script whose layer references an asset that does not exist on disk
- WHEN the script is rendered without `--allow-mock`
- THEN the system fails with a named, non-zero error
- AND it never emits a mock MP4 or a silently color-only frame in the asset's place

### Requirement: Spend Guard Is Gate-Only

The spend guard MUST gate spend: it decides whether a resolved model is allowed by the domaiNN allowlist of the merged model catalog and whether the run fits the cascaded `budget` and any daily cap. It MUST NOT select a model id, MUST NOT hold an allowlist or price of its own, and MUST NOT supply any cascade level.
(Previously: the guard's own `allowedModels` list decided which models were allowed.)

#### Scenario: Blocked resolved model is refused before spend

- GIVEN a resolved model that the domaiNN does not allow
- WHEN `compile` runs
- THEN the whole run is refused before the first charge with a named error

#### Scenario: Guard never selects

- GIVEN the guard module
- WHEN it is inspected
- THEN it returns only allow/deny and budget verdicts, never a model id

#### Scenario: Allowlist is the catalog allowlist

- GIVEN the merged model catalog
- WHEN the guard allowlist is read
- THEN it equals the domaiNN allowlist of the catalog

### Requirement: Voice Parameters Resolve Through The Cascade

The engine MUST resolve `voice_model`, `voice`, `voice_speed` and `voice_emotion` for each Scene from the same cascade as every other parameter, with presets expanded, and MUST NOT inject Preset values into the Scene's own fields (D4).

An explicit Scene `voice` or `voice_model` MUST beat any Preset. A Video-level Preset MUST sit beneath explicit Video fields and above Series values, and MUST NOT enter at Scene precedence.
(Previously: `voice_tone` was among the resolved parameters.)

#### Scenario: Scene explicit voice beats a Video preset

- GIVEN a Video with `presets:: [A]` where A sets `voice:: from-a`, and a Scene with `voice:: own`
- WHEN the Scene is compiled
- THEN the TTS voice is `own`

#### Scenario: Video explicit beats a Video preset

- GIVEN a Video with `voice_model:: video-model` and `presets:: [A]` where A sets `voice_model:: from-a`
- WHEN a Scene that sets neither is compiled
- THEN the TTS model is `video-model`

#### Scenario: Video preset sits above Series

- GIVEN a Series with `voice:: series-voice` and a Video with `presets:: [A]` where A sets `voice:: from-a`
- WHEN a Scene that sets no voice is compiled
- THEN the TTS voice is `from-a`

### Requirement: Derivation Guards Its Input And Its Outputs

The format step MUST refuse a master that ffprobe does not report as the declared master size, MUST read the slug from the master file name `<slug>_<W>x<H>.mp4`, and MUST skip an existing output unless `--force` is passed.
(Previously: the master had to be reported as 1920x1920 and the name was `<slug>_1920x1920.mp4`.)

Source: D5.

#### Scenario: Wrong-size master is refused

- GIVEN a master that ffprobe reports as 1920x1080 while the declared master is 1920x1920
- WHEN the format step runs
- THEN it fails with a named error and writes no output

#### Scenario: Existing output is kept

- GIVEN `<slug>_1080x1920.mp4` already exists
- WHEN the format step runs without `--force`
- THEN the file is not modified and the run reports it as skipped
- AND with `--force` the file is rewritten

#### Scenario: Derivation is deterministic

- GIVEN the same master derived twice on one machine
- WHEN the two vertical outputs are compared
- THEN they are identical files

### Requirement: Blur Fill Is Opt-In And Suffixed

Blur-filled variants MUST be produced only when `--fill blur` is passed, MUST use the existing blur-fill filter graph (`buildBlurFillFilter`), MUST apply only to the vertical and horizontal formats, and MUST be named `<slug>_<W>x<H>_blur.mp4`; the default fill MUST be `crop`, and an explicit `--fill crop` MUST produce exactly the output of the default.
(Previously: `--fill crop` was not covered and did not behave as the default.)

Source: D5, settled default 2. Slice: 0 (V_0-14-x, quick win 5).

#### Scenario: Default does not blur

- GIVEN a derivation run without `--fill`
- WHEN the outputs are listed
- THEN no file name ends in `_blur.mp4`

#### Scenario: Explicit crop equals the default

- GIVEN a derivation run with `--fill crop` and one without `--fill` on the same master
- WHEN the outputs are compared
- THEN the files are identical and the `--fill crop` run exits zero

#### Scenario: Blur variant coexists with the crop

- GIVEN `<slug>_1080x1920.mp4` already published
- WHEN the vertical format is derived with `--fill blur`
- THEN `<slug>_1080x1920_blur.mp4` is written and the crop file is unchanged

#### Scenario: Square ignores blur

- GIVEN `--fill blur` with the square format
- WHEN the outputs are derived
- THEN `<slug>_1080x1080.mp4` is written by the lanczos scale and no `_blur` square exists

### Requirement: Render Compiles Every Time And Writes The Master In Place

The `render` command MUST accept only a script (`render <manifest.json>` MUST NOT exist), MUST compile on every run, MUST render to a temporary file in the episode folder and MUST then rename it on the same volume to `<slug>_<W>x<H>.mp4`, so that exactly one master exists per episode.
(Previously: the temporary file was `E/build/render.tmp.mp4` and the master `E/<slug>_1920x1920.mp4`.)

Source: D2.

A rename that fails because the target is open MUST end in an error message that explains the open file.

#### Scenario: Stale manifest cannot be rendered

- GIVEN a manifest from before a script edit
- WHEN `render <script>` runs
- THEN the manifest is regenerated from the current script before rendering

#### Scenario: Master appears atomically

- GIVEN a render in progress
- WHEN the final file is observed before completion
- THEN the master path is either absent or the previous complete master, never a partial file

#### Scenario: Failed render keeps the previous master

- GIVEN an existing master and a render that fails midway
- WHEN the episode folder is listed
- THEN the previous master is unchanged and no temporary file remains

#### Scenario: Manifest argument is refused

- GIVEN a path to `manifest.json`
- WHEN `render` is run with it
- THEN it exits non-zero with a usage showing a script argument

### Requirement: Render Refuses Missing Avatar Clips

The `render` command MUST refuse to render when a presenter Layer has no cached avatar clip, with a named non-zero error that states the avatar synthesis command. There is no override flag: the way forward is to synthesize the avatars first. The refusal MUST be enforced in code (`lib/avatar-jobs.mjs`), not only documented, and MUST name every presenter Layer lacking a clip.
(Previously: stated as a requirement but not enforced by the code path.)

Source: D8. Slice: 0 (V_0-14-x, quick win 3).

#### Scenario: Missing clip stops the render

- GIVEN a presenter Layer whose avatar clip is not in the cache
- WHEN `render <script>` runs
- THEN it fails before rendering, states the avatar synthesis command, and writes no master

#### Scenario: Every missing layer is named

- GIVEN two presenter Layers, one with a cached clip and one without
- WHEN `render <script>` runs
- THEN the error names only the Layer without a clip

#### Scenario: All clips present renders

- GIVEN every presenter Layer has a cached clip
- WHEN `render <script>` runs
- THEN the render proceeds

### Requirement: Plan Boilerplate Is Truthful

The plan document MUST list the stamped resolved model ids instead of a `- [ ]` checklist, MUST NOT contain a hard-coded "Recommended" tier or "Speech 2.5 HD", and any approval instruction it shows MUST be the one the engine accepts, tied to the plan hash; the `checkApproval` hint MUST use the same instruction.
(Previously: the plan was required to show the in-chat phrase `approve the plan <hash8>`.)

Source: D10.

#### Scenario: Plan lists resolved models

- GIVEN a script whose TTS model resolves to `minimax/speech-2.8-hd`
- WHEN the plan is generated
- THEN it lists that id and contains neither "Speech 2.5 HD" nor "Recommended"

#### Scenario: Approval hint matches

- GIVEN a missing approval of an over-budget plan
- WHEN `checkApproval` fails
- THEN its hint contains the same instruction as the plan and names the plan hash

### Requirement: Cache Identity Image Options Never Gain Size

The image `mediaOptions` MUST NOT include a `size` key or any key derived from the master resolution. The image key MUST be computed from the prompt and the options `{provider, model, accentColor, modelOverride?}`, where `model` is the cascaded `image_model` of the scene, and MUST NOT contain the scene or layer display title. Changing the resolved `image_model` MUST change the key; renaming a scene or layer MUST NOT.
(Previously: `model` did not follow the cascade `image_model`, and the options included `title: "<scene.name> — <layer.name>"`.)

Source: D3, cache-key audit. Slice: 0 (V_0-14-x, quick win 1). Accepted consequence: the first run after the change re-bills images once.

#### Scenario: Square master adds nothing to the image key

- GIVEN a committed golden image key for a scene under the new option set
- WHEN the scene is compiled with the 1920x1920 master
- THEN the image key equals the golden

#### Scenario: Changing the image model changes the key

- GIVEN a scene compiled with `image_model:: A` and again with `image_model:: B`
- WHEN the two image keys are compared
- THEN they differ and the second compile is a cache miss

#### Scenario: Renaming a scene does not re-bill

- GIVEN a scene whose display name changes and nothing else
- WHEN the image key is recomputed
- THEN it is equal and the compile is a cache hit

### Requirement: Cache Identity Location And Domain Root Are Unchanged

The cache MUST stay at `<findDomainRoot>/.cognnitive/cache/video/{tts,images,temp}` where the domain root is the nearest `domaiNN_NN.md`, the episode folder MUST NOT change the domain root, and the ledger, the timing log, `pending-predictions.jsonl`, `locks/` and `video-guard.json` MUST stay at the domain root.
(Previously: scenarios were phrased around a `build/` folder, and the timing log did not exist.)

Source: D2, cache-key audit, invariants 1 and 10.

#### Scenario: Episode folder does not relocate the cache

- GIVEN an episode folder with an emitted project
- WHEN the cache directory is resolved from the script
- THEN it is `<domain root>/.cognnitive/cache/video`

#### Scenario: Domain root detection is unchanged

- GIVEN `domaiNN_NN.md` two levels above an episode
- WHEN the domain root is resolved from the script and from the emitted project folder
- THEN both resolve to the folder holding `domaiNN_NN.md`
- AND the ledger, timing log, locks and `video-guard.json` are read from there

## REMOVED Requirements

### Requirement: Engine Output Is Written Only Under build/

(Reason: D8 removes the separate `build/` directory and the content-addressed staging layer; replaced by "Engine Project Lives In The Episode Folder" and "Assets Are Linked, Not Copied".)
(Migration: the manifest and project live in the episode folder under names fixed by design; asset links replace staged copies.)

### Requirement: Voice Tone Is Authoring Guidance Only

(Reason: `voice_tone` is a dead field that nothing reads; it is retired and rejected as `retired-key`.)
(Migration: remove `voice_tone` from scripts, Presets and defaults.)

### Requirement: Single Square Master Declared By master_resolution

(Reason: `master_resolution` is retired; replaced by "Master Size Comes From output_formats".)
(Migration: declare `output_formats:: [master=<W>x<H>, ...]`.)
