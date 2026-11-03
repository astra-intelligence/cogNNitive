# Delta for video-folder-contract

Living spec read: `openspec/specs/video-folder-contract/spec.md`. The folder layout itself does not change: episodes stay at `series/<s>/assets/<slug>/`, series anchors stay `<s>_scope_NN.md`, three-level asset scoping, the no-upward-escape rule, ephemeral engine directories, deliverables in place, `build/` and the gitignore block are unchanged. What changes is the status of the layout: it stops being a convention of this contract and becomes the placement rule that the `video-script` bluepriNNt declares (`concept-storage-declaration`), validated by `placement-validation`. The file name of the episode script also stops depending on a domain-unique stem.

Verification needed (design): the requirement "Canonical Domain, Series And Episode Layout" still names the script file `<slug>_video-script_<s>_NN.md`. If the stem derivation chosen by design differs, that requirement must be re-stated at the same time; this delta does not preempt it.

## MODIFIED Requirements

### Requirement: Naming Scheme By File Class

File and folder names MUST follow one scheme by class: domain-indexed documents (`_NN.md`) are `<stem>_<blueprint-or-role>_NN.md` with a kebab-case stem derived from the folder slug as specified by `nn-naming-contract` (instance model stem), working files inside `E` carry fixed `snake_case` role names with neither slug nor `V_`, deliverables that leave `E` are `<slug>_<what?>_<W>x<H>.<ext>` named by true dimensions, and `description.md` carries no slug and no `V_`.

Source: D1.

The episode script MUST keep a domain-indexed name that satisfies the instance-model naming rule of the `video-script` bluepriNNt declaration. Its stem is no longer required to be unique across the domaiNN, because identity is hierarchical (`hierarchical-identity`); the parent series name MUST NOT be needed in the stem to avoid collisions. Folders MUST be lowercase, plural when they hold many items (`assets`, `sounds`, `components`, `frames`, `animations`, `procedures`) and singular for mass nouns (`media`, `shared`, `build`). Every file and folder name MUST be English. Authored `Hyperframes/` folders are tolerated and are not renamed; new episodes use `animations/`.
(Previously: the stem had to be domain-unique, and the script MUST keep the name `<slug>_video-script_<s>_NN.md` because stems must be unique.)

#### Scenario: Deliverable name carries slug and true dimensions

- GIVEN episode slug `startup-founder` and a vertical derivation
- WHEN the output is written
- THEN its name is `startup-founder_1080x1920.mp4`

#### Scenario: Working files carry no slug or version

- GIVEN a freshly drafted episode
- WHEN `draft.json`, `reviewed.json` and `review_console.html` are inspected
- THEN none of their names contains the slug or a `V_x-y-z` tag

#### Scenario: Script name satisfies the declared rule

- GIVEN `build-script-from-draft.mjs` run for episode `startup-founder` in series `cognitive-use-cases`
- WHEN the script is written
- THEN its name satisfies the instance-model naming rule for folder slug `startup-founder`
- AND placement validation reports no naming finding

#### Scenario: Same episode slug in two series

- GIVEN episode `intro` in series `villabotijos-today` and episode `intro` in series `innteresante`
- WHEN both scripts are written
- THEN both names satisfy the rule without carrying the series name
- AND `check_domain` reports no duplicate identity

#### Scenario: Spanish names are reported, not renamed

- GIVEN a real-domain procedure file with a Spanish name
- WHEN the canonical layout is applied to a new episode
- THEN the existing file keeps its name and the contract states that new names are English

## ADDED Requirements

### Requirement: Series and episode locations are declared by the bluepriNNt

The location of a Series scope document and of an episode folder MUST be the placement rule declared by the `video-script` bluepriNNt for `Series` and `Video`. This contract MUST NOT define a second, independent copy of that rule, and the cross-check test between this specification, `references/folder-contract.md` and SKILL.md MUST compare their layout with the declared rule.

#### Scenario: Layout agrees with the declaration
- GIVEN the placement rules declared for `Series` and `Video`
- WHEN the cross-check test runs
- THEN `series/<s>/` and `series/<s>/assets/<slug>/` in this specification, `folder-contract.md` and SKILL.md match the declared rules

#### Scenario: Episode outside its placement
- GIVEN an episode script under `kNNowledge/`
- WHEN `check_domain` runs
- THEN a placement error is reported
- AND the folder-contract check does not accept it as an episode

### Requirement: An episode is stored once

An episode MUST be stored as its instance model only. The same episode MUST NOT also be listed as a `Video` element of a compact registry (`INNteresante_video_NN.md`, `VillabotijosToday_video_NN.md` style).

#### Scenario: Registry duplicate is reported
- GIVEN `pepper-mapache` as an episode model and as an element of `VillabotijosToday_video_NN.md`
- WHEN `check_domain` runs
- THEN a double-storage error names both locations
