# video-script-review Specification

## Purpose

Defines the single review gate of an episode: the script, before spend. Covers what the reviewer decides, how the gate and the budget interact, and how a needs-change scene is regenerated alone. Decision D4 of change `2026-11-02-video-script-v1`. Open question Q2 (how variants and verdicts are represented in a proposed changeset) is design-owned; the persistence requirement below is normative either way.

## Requirements

### Requirement: Review Decisions Are Per Scene

For each scene the reviewer MUST be able to choose among the proposed narration variants (up to the kind's `variants`), edit the narration, and mark the scene `approved` or `needs-change` with a comment. The reviewer MUST see, beside the script, the estimated cost against the budget with price provenance.

#### Scenario: Pick a variant

- GIVEN a scene with 3 narration variants
- WHEN the reviewer chooses variant 2
- THEN variant 2 becomes the scene's narration and the others are retained as not chosen

#### Scenario: Cost is visible

- GIVEN a proposed script
- WHEN the review is opened
- THEN the estimated total and the budget are shown and the total changes when a variant is chosen

### Requirement: Decisions Are Persisted, Never View-Only

Every review decision (chosen variant, edited narration, verdict, comment) MUST be persisted in the proposed changeset or in a sidecar defined by design, and MUST reach the produced master. A decision that exists only in view state MUST NOT exist. The pipeline MUST read the persisted decisions only.

#### Scenario: Edit reaches the master

- GIVEN a reviewer edit of one scene's narration
- WHEN `produce` runs after the review
- THEN the TTS input of that scene equals the edited text

#### Scenario: Reload keeps decisions

- GIVEN verdicts set in the review view
- WHEN the view is closed and reopened
- THEN the same verdicts and comments are shown

### Requirement: Approval Requires Every Scene Approved

The script MUST be approved only when every scene has the verdict `approved`. A single `needs-change` scene MUST keep the episode out of `approved`. Approval MUST be recorded with the `plan_hash` it applies to.

#### Scenario: One scene needs change

- GIVEN a script with 5 scenes, 4 approved and 1 `needs-change`
- WHEN `produce` runs
- THEN it stops at the review gate and the state is not `approved`

#### Scenario: All approved

- GIVEN every scene `approved`
- WHEN the review is submitted
- THEN the approval is recorded with the current `plan_hash`

### Requirement: Review Gate Is A Cascade Field

`script_review` MUST be a cascade field with values `required` and `skip`, settable on Series, Video and Scene Kind, with the blueprint default `required`. With `skip`, the review gate MUST NOT stop the run and the script MUST be treated as approved.

#### Scenario: Series skips review

- GIVEN a Series with `script_review:: skip` and an episode that sets none
- WHEN `produce` runs on a proposed script
- THEN no review stop occurs and the state becomes `approved`

#### Scenario: Episode requires review

- GIVEN a Series with `skip` and an episode with `script_review:: required`
- WHEN `produce` runs
- THEN it stops at the review gate

### Requirement: Budget Gate Is Independent Of The Review Gate

`budget` MUST be a cascade field (a number in the domaiNN currency). When the estimate does not exceed the budget, the cost MUST be auto-approved and no typed approval MUST be requested. When it exceeds the budget, `produce` MUST stop and ask for approval of that `plan_hash`. `script_review:: skip` MUST NOT bypass this stop.

#### Scenario: Under budget auto-approves

- GIVEN an estimate of 1.20 and `budget:: 2.00`
- WHEN the review is approved
- THEN no cost approval prompt occurs

#### Scenario: Over budget stops even when review is skipped

- GIVEN `script_review:: skip`, an estimate of 3.50 and `budget:: 2.00`
- WHEN `produce` runs
- THEN it stops at the budget gate and spends nothing

#### Scenario: Approved hash proceeds

- GIVEN an over-budget estimate approved for hash `h1`
- WHEN `produce` runs with unchanged inputs
- THEN it proceeds without asking again

#### Scenario: Plan change invalidates approval

- GIVEN a cost approval for hash `h1` and a narration edit that changes the hash
- WHEN `produce` runs
- THEN the budget gate applies again

### Requirement: A Needs-Change Scene Is Regenerated Alone

A scene marked `needs-change` MUST be returned to the agent with its comment, and only that scene's proposal MUST change. Every other scene's narration, verdict and cached assets MUST remain untouched, and unchanged scenes MUST keep their approval.

#### Scenario: Only one scene changes

- GIVEN scenes 1 to 5 where scene 3 is `needs-change`
- WHEN the agent regenerates it
- THEN scenes 1, 2, 4 and 5 are byte-identical in the proposal and keep their verdicts
- AND their TTS cache entries are still hits

#### Scenario: Regenerated scene returns to review

- GIVEN a regenerated scene 3
- WHEN the review is opened
- THEN scene 3 is shown as pending and the others remain approved
