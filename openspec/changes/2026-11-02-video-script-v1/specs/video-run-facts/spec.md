# video-run-facts Specification

## Purpose

Defines the append-only JSONL facts of a run: the spend ledger and the stage timing log, their schemas and guarantees. Facts stay JSONL by decision (D11, D13). Console views read them. Change `2026-11-02-video-script-v1`.

## Requirements

### Requirement: Spend Ledger Is Keyed By Episode And Plan

The spend ledger MUST be an append-only JSONL file at the domaiNN root. Every record MUST carry `ts`, `kind`, `model`, `ref`, `est_usd`, `cache_hit`, `outcome`, `episode` and `plan_hash`, where `episode` identifies the episode and `plan_hash` the plan the spend belongs to. Records MUST NOT be rewritten or deleted by the engine.

#### Scenario: Record carries keys

- GIVEN a paid TTS call during `produce`
- WHEN its ledger record is read
- THEN it carries the episode, the `plan_hash`, the model, the estimate and the outcome

#### Scenario: Append-only

- GIVEN an existing ledger
- WHEN a run completes
- THEN every earlier line is byte-identical

#### Scenario: Cache hits are recorded

- GIVEN a cache hit
- WHEN the run completes
- THEN a record with `cache_hit: true` and zero spend exists

### Requirement: Real Cost Per Episode Is Derivable

Summing the ledger by `episode` MUST give the episode's real cost, and a run summary MUST equal the ledger lines of that run. The ledger MUST be written before the provider call it describes is made visible as spent; when the ledger cannot be written the run MUST fail before the call.

#### Scenario: Sum equals summary

- GIVEN a completed run
- WHEN the ledger lines of its `plan_hash` are summed
- THEN the total equals the real cost in the summary

#### Scenario: Unwritable ledger blocks spend

- GIVEN a read-only ledger
- WHEN `produce` runs
- THEN it fails before the first provider call

### Requirement: Prices Are Part Of The Plan Hash

The `plan_hash` MUST be computed from the plan content and the resolved prices (with their dates), so that a price change yields a different hash and invalidates an earlier approval.

#### Scenario: Price change changes the hash

- GIVEN two estimates of the same script with different resolved prices
- WHEN their hashes are compared
- THEN they differ

#### Scenario: Same inputs same hash

- GIVEN two estimates with identical script and prices
- WHEN their hashes are compared
- THEN they are equal

### Requirement: Stage Timing Log

Every stage of every run MUST append one JSONL record to the timing log at the domaiNN root with `episode`, `stage`, `plan_hash`, `start`, `end`, `duration_ms`, `cache_hits`, and for the render stage `frames`, `effective_fps` and `resolution`. Each run MUST also record a machine fingerprint with CPU, GPU, RAM and HyperFrames version. A failed stage MUST record its outcome.

#### Scenario: Render record

- GIVEN a completed render stage
- WHEN its timing record is read
- THEN it carries frames, effective fps, resolution and duration

#### Scenario: Fingerprint present

- GIVEN any run
- WHEN its timing records are read
- THEN each carries or references the same machine fingerprint

#### Scenario: Failed stage is recorded

- GIVEN a render that fails
- WHEN the log is read
- THEN the render record has the failure outcome and no later stage record exists

### Requirement: Provider Calls Separate Queue From Processing Time

A provider call record MUST store queue time and processing time as separate values.

#### Scenario: Separate durations

- GIVEN an avatar prediction that queued for 40 s and processed for 90 s
- WHEN its record is read
- THEN `queue_ms` is 40000 and `processing_ms` is 90000

### Requirement: A Timing Write Failure Does Not Stop A Run

A failure to append a timing record MUST produce a warning and MUST NOT fail or stop a run. A ledger failure remains governed by the ledger requirement.

#### Scenario: Timing log unwritable

- GIVEN a read-only timing log
- WHEN `produce` runs
- THEN the run completes and a warning names the file
