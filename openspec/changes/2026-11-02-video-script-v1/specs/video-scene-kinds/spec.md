# video-scene-kinds Specification

## Purpose

Defines how a Series declares the scene grammar of its format (Scene Kind elements), how an episode scene states its kind, the `Libre` escape hatch, engine-inserted fixed scenes, and series chrome applied per kind. Decisions D1, D2, D3, D12 of change `2026-11-02-video-script-v1`. Field names below are provisional until design.md fixes the Field Definitions; behaviour is normative.

## Requirements

### Requirement: Series Declares Scene Kinds

A Series scope document MUST be able to declare zero or more `Scene Kind` elements, each with a unique name and these properties: `role` (free text), `narration` (`on` or `off`), `max_duration` (seconds, optional), `variants` (positive integer, default 1) and `fixed` (engine-inserted scene, default false). A Scene Kind MAY also list `presets` and any cascade parameter whose Field Definition lists `Scene Kind`.

#### Scenario: Kinds are read from the Series

- GIVEN a Series declaring kinds `Gancho`, `Noticia` and `Cierre`
- WHEN the model of an episode in that Series is read
- THEN the three kinds are available to every scene of the episode with their properties

#### Scenario: Duplicate kind name

- GIVEN a Series declaring two Scene Kinds named `Noticia`
- WHEN the Series is checked
- THEN a `kind-duplicate` error naming the document is reported before any spend

#### Scenario: Series without kinds

- GIVEN a Series that declares no Scene Kind
- WHEN an episode scene states `kind:: Libre`
- THEN the episode validates, and any other kind name fails with `unknown-kind`

### Requirement: Every Scene States Its Kind

Every `Scene` of a V_1-0-0 episode MUST state `kind::` with the name of a Scene Kind of its Series or the reserved name `Libre`. A scene's content MUST be its narration body plus an optional visual asset reference or image prompt; the engine, not the episode, derives the layers of a non-`Libre` scene from its kind and the Series chrome. An unknown kind name MUST fail the pre-compile check with `unknown-kind`, naming the scene, the name and the kinds available, before any spend.

#### Scenario: Known kind validates

- GIVEN a scene with `kind:: Noticia` in a Series that declares `Noticia`
- WHEN the script is checked
- THEN no kind error is reported

#### Scenario: Missing kind

- GIVEN a scene with no `kind::`
- WHEN the script is checked
- THEN a `missing-kind` error names the scene

#### Scenario: Unknown kind stops the run

- GIVEN a scene with `kind:: Noticias` and no such kind
- WHEN `produce` runs
- THEN it fails with `unknown-kind` listing the declared kinds
- AND nothing is spent

### Requirement: Kind Rules Are Enforced

For a non-`Libre` scene the engine MUST apply its kind's rules. `narration:: off` MUST mean no TTS request is made and a non-empty narration body is a `narration-not-allowed` error. `max_duration` MUST be compared with the estimated duration before spend and with the measured duration after TTS; an overrun MUST be reported as a warning naming the scene, the limit and the duration. `variants` MUST be the number of narration alternatives the agent proposes for that scene (see capability `video-script-review`).

#### Scenario: Silent kind makes no TTS call

- GIVEN a kind with `narration:: off` and a scene of that kind without narration
- WHEN `produce` runs
- THEN no TTS request is made for that scene

#### Scenario: Narration on a silent kind

- GIVEN a scene of a `narration:: off` kind whose body contains text
- WHEN the script is checked
- THEN `narration-not-allowed` names the scene

#### Scenario: Overrun is reported

- GIVEN a kind with `max_duration:: 8` and a narration measured at 11 s
- WHEN the run summary is produced
- THEN a warning names the scene, 8 s and 11 s and the run is not stopped

### Requirement: Fixed Scenes Are Inserted By The Engine

A Scene Kind with `fixed:: true` MUST describe a scene the engine inserts without the episode declaring it, with a declared placement (`start`, `end`, or `after <kind>` meaning after the first scene of that kind). The episode MUST NOT need to contain such a scene, and the inserted scene MUST appear in the manifest, the estimate and the chapters in its placed order.

#### Scenario: Bumper is inserted

- GIVEN a fixed kind `Intro` placed `after Gancho` and an episode with scenes `Gancho`, `Noticia`, `Cierre`
- WHEN the manifest is compiled
- THEN the scene order is `Gancho`, `Intro`, `Noticia`, `Cierre`
- AND the episode document holds no `Intro` scene

#### Scenario: Missing anchor kind

- GIVEN a fixed kind placed `after Gancho` and an episode with no `Gancho` scene
- WHEN the manifest is compiled
- THEN the fixed scene is not inserted and one warning names the kind and the missing anchor

### Requirement: Series Structure Is Orientative

An episode MAY reorder, remove or repeat scenes of any kind. The engine MUST NOT require the series' kind sequence and MUST NOT reject an episode for deviating from it.

#### Scenario: Repeated and reordered scenes

- GIVEN an episode with scenes `Noticia`, `Noticia`, `Gancho`
- WHEN the script is checked
- THEN it validates and the compiled order equals the episode order, plus fixed scenes

### Requirement: Libre Inherits No Kind Rules

A scene with `kind:: Libre` MUST inherit no kind rules, no kind presets and no kind-scoped chrome. It MAY declare hand-authored `Layer` elements or an `animation` Layer pointing at its own HyperFrames project. A non-`Libre` scene MUST NOT declare `Layer` elements (error `layers-not-allowed`, naming the scene and its kind). Cascade levels other than `kind` still apply to a `Libre` scene.

#### Scenario: Libre with its own layers

- GIVEN a `Libre` scene with an `animation` Layer
- WHEN the script is checked and compiled
- THEN it validates and none of the Series' kind rules or chrome is applied to it

#### Scenario: Layers on a ruled kind

- GIVEN a scene of kind `Noticia` with a nested `Layer`
- WHEN the script is checked
- THEN `layers-not-allowed` names the scene and `Noticia`

#### Scenario: Libre still gets series values

- GIVEN a Series with `transition:: fade` and a `Libre` scene setting none
- WHEN its transition is resolved
- THEN the value is `fade` with source `series`

### Requirement: Series Chrome Is Declared Once And Applied Per Kind

A Series MUST be able to declare chrome: persistent or per-kind elements such as a watermark, bumper, call to action, background audio and avatar, each with the kinds it applies to (default: all non-`Libre` kinds). Chrome text MUST be declarable per language. The engine MUST apply chrome to every applicable scene without the episode repeating it. A chrome text with per-language variants MUST resolve with the cascaded `language`; a missing variant for that language MUST fail before spend with `missing-chrome-language` naming the chrome item and language. A chrome text declared once without variants is language-neutral.

#### Scenario: Watermark follows the language

- GIVEN a Series watermark declared as `es: generado con IA` and `en: made with AI`, and an episode with `language:: en`
- WHEN the manifest is compiled
- THEN every applicable scene carries the watermark overlay with `made with AI`

#### Scenario: Chrome applies only to listed kinds

- GIVEN a chrome call to action applying only to kind `Cierre`
- WHEN the manifest is compiled
- THEN only `Cierre` scenes carry it

#### Scenario: Missing language variant

- GIVEN a watermark with only an `es` variant and `language:: en`
- WHEN `produce` runs
- THEN it fails with `missing-chrome-language` naming the watermark and `en`
- AND nothing is spent

### Requirement: Language Is A Cascade Field

`language` MUST be a cascade parameter set by the Series and overridable by an episode, driving voice selection, chrome text, narration rules and the description language. An unset language MUST resolve from the blueprint default.

#### Scenario: Episode overrides the series language

- GIVEN a Series with `language:: es` and an episode with `language:: en`
- WHEN `language` is resolved for a scene
- THEN the value is `en` with source `video`
