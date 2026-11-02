# video-produce-command Specification

## Purpose

Defines `produce <episode>`: the single deterministic engine command that takes an approved-or-reviewable episode to a master with formats, recorded cost and timings, and the only two places where it stops. Decision D6 of change `2026-11-02-video-script-v1`.

## Requirements

### Requirement: One Command Sequences The Whole Pipeline

The engine CLI MUST provide `produce <episode>` that performs, in this order and without further instruction: validation (registry keys, kinds, catalog, chrome), series structure and chrome application, cascade resolution, estimate, review gate and budget gate, TTS, avatar synthesis, image synthesis, compile, render, format derivation, chapter block, timing log, and lifecycle writes. The agent MUST NOT need to invoke any of these steps individually. The primitives `compile`, `render` and `synthesize-avatar` MAY remain for diagnosis.

#### Scenario: Pilot goes from draft to produced in one run

- GIVEN an episode in state `draft` with `script_review:: skip` and an estimate within budget
- WHEN `produce <episode>` runs
- THEN it ends with the master and every declared format written, the state `produced`, and a summary of real cost and stage timings

#### Scenario: Order is fixed

- GIVEN a successful run
- WHEN the timing log of that run is read
- THEN the stages appear in the fixed order and no provider spend precedes the estimate

#### Scenario: Nothing to sequence by hand

- GIVEN the skill documentation
- WHEN it is searched for instructions that tell the agent to run `compile`, `synthesize-avatar` or `render` as steps
- THEN none is found

### Requirement: Produce Stops Only At Two Points

`produce` MUST stop only (a) at the script review when `script_review` resolves to `required` and the script is not yet approved, and (b) before spend when the estimate exceeds the cascaded `budget` and no approval of that `plan_hash` exists. Every other failure MUST be a named non-zero error. A stop MUST exit with a distinct, documented status that says which gate stopped it, and MUST leave no partial spend.

#### Scenario: Review stop

- GIVEN `script_review:: required` and an unreviewed script
- WHEN `produce` runs
- THEN it stops with the review-gate status, spends nothing and states how to continue

#### Scenario: Budget stop

- GIVEN `script_review:: skip` and an estimate above `budget`
- WHEN `produce` runs
- THEN it stops with the budget-gate status naming the estimate, the budget and the `plan_hash`

#### Scenario: Within budget continues

- GIVEN an approved script and an estimate not above `budget`
- WHEN `produce` runs
- THEN no stop occurs and the run proceeds to spend

### Requirement: Fail Before Spend

All validation and estimation MUST complete, and the ledger MUST be writable, before the first provider call. A run MUST NOT call a provider when validation, catalog resolution, guard or budget checks fail.

#### Scenario: Invalid script costs nothing

- GIVEN a script with an `unknown-key`
- WHEN `produce` runs
- THEN it fails and no ledger entry of kind spend and no provider request exist

### Requirement: Produce Is Resumable And Cache-Aware

A re-run MUST reuse cache hits at zero cost and MUST resume pending provider predictions without re-billing. The estimate of a re-run MUST price cached items at $0. The `plan_hash` MUST include resolved prices (see capability `video-run-facts`).

#### Scenario: Second run is free

- GIVEN a produced episode with unchanged inputs
- WHEN `produce` runs again
- THEN every item is a cache hit, no provider request is made and the master is replaced atomically

#### Scenario: Interrupted run resumes

- GIVEN a run interrupted after a provider prediction was submitted
- WHEN `produce` runs again
- THEN the pending prediction is resumed and not submitted twice

### Requirement: The Engine Owns Lifecycle Writes

`produce` MUST set `approved` when the review is done or skipped and the budget gate passes, and `produced` with the `master` field only after the master and every declared format exist. It MUST write them through apply_change. A failed run MUST NOT set `produced`.

#### Scenario: Produced is set last

- GIVEN a run that fails during rendering
- WHEN the episode record is read
- THEN the state is `approved` and `master` is unchanged

#### Scenario: Status written through apply_change

- GIVEN a successful run
- WHEN the change history of the episode is read
- THEN the `approved` and `produced` writes are changesets applied by the engine

### Requirement: Produce Refuses Episodes It Cannot Produce

`produce` MUST fail with a named error for an episode in state `idea` (no script), `published` or `archived`, and for an episode whose pinned blueprint version is not the installed one.

#### Scenario: Idea cannot be produced

- GIVEN an episode in state `idea`
- WHEN `produce` runs
- THEN it fails naming the state and that no script was proposed

#### Scenario: Old pinned version

- GIVEN an episode pinned to `video-script_V_0-14-1`
- WHEN `produce` runs
- THEN it fails naming the pin and the installed version, and converts nothing

### Requirement: Produce Reports Real Cost And Timings

At the end of a run `produce` MUST print, per stage, duration and cache hits, the total real cost against the estimate and the budget, and the chapter block of the description.

#### Scenario: Summary printed

- GIVEN a completed run
- WHEN the summary is read
- THEN it lists each stage with its duration, the real total cost, the estimate, the budget and the chapter lines
