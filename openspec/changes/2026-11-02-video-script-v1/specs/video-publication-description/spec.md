# Delta for video-publication-description

Change `2026-11-02-video-script-v1`. Decision D6: the agent produces the description prose; `produce` replaces finalize and computes the chapters. Assumption A1: `produce` writes the chapter block into `description.md` (see change summary).

## ADDED Requirements

### Requirement: Produce Writes The Chapter Block

`produce`, through `lib/description.mjs`, MUST compute one chapter line per scene as `floor(fromFrame / fps)` from the manifest of the run (the scene title from `props.title`), including engine-inserted fixed scenes in their placed order, MUST run after render, and MUST write the lines under a `Chapters` heading of `description.md` without altering any agent-authored text, replacing only a previous chapter section. It MUST also print the block in the run summary.

Source: D6.

#### Scenario: Chapters written after the prose

- GIVEN a `description.md` with agent-authored title, summary and sources, and a rendered manifest
- WHEN `produce` completes
- THEN the file holds the unchanged prose plus a `Chapters` section with one `MM:SS Title` line per scene, the first being `00:00`

#### Scenario: Re-produce replaces only the chapters

- GIVEN a `description.md` that already has a `Chapters` section
- WHEN `produce` runs again after a narration edit
- THEN only the `Chapters` section changes

#### Scenario: Fixed scenes are chaptered

- GIVEN a fixed bumper scene inserted by the engine
- WHEN the chapters are written
- THEN the bumper has its own line in placed order

#### Scenario: No description file yet

- GIVEN an episode whose proposal carried no description prose
- WHEN `produce` completes
- THEN `description.md` is created containing only the `Chapters` section

## MODIFIED Requirements

### Requirement: description.md Is A Platform-Neutral Episode File

Each episode MAY have one `E/description.md`, a pasted publication body whose name MUST NOT carry a slug, a version tag or a platform name, whose prose (title, summary, sources, attribution) is authored by the agent as part of the proposed changeset in the cascaded `language`, and whose engine-written part (the chapter block) MUST contain no platform-specific text.
(Previously: the agent wrote the whole file from finalize's printed output.)

Source: D1, D6.

#### Scenario: Name is neutral

- GIVEN a produced episode
- WHEN its folder is listed
- THEN the publication file is `description.md` and no `descripcion_youtube.md` or `youtube*.md` exists

#### Scenario: Printed chapters are platform-free

- GIVEN the chapter output of `produce`
- WHEN it is read
- THEN it contains only `MM:SS Title` lines and no platform name

#### Scenario: Prose follows the language

- GIVEN an episode with `language:: en`
- WHEN the agent drafts the description
- THEN the prose is in English

## REMOVED Requirements

### Requirement: Finalize Prints The Chapter Block

(Reason: `finalize-video.mjs` is removed; `produce` computes and writes the chapter block.)
(Migration: see "Produce Writes The Chapter Block"; the line format and floor rule are unchanged and remain governed by "Chapter Starts Come From Measured Durations".)
