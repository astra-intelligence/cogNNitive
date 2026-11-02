# video-model-catalog Specification

## Purpose

Defines the Provider, Model and Voice catalog as kNNowledge: the dated reference catalog shipped by the `video-script` bluepriNNt, the domaiNN allowlist and price override, the merged catalog that is the single source for the spend guard, estimator, picklists and adapters, and per-model intent adapters. Decision D5 of change `2026-11-02-video-script-v1`. Open questions Q4 (stale price reporting) and Q7 (`infinitetalk`) are recorded in the requirements that depend on them.

## Requirements

### Requirement: Blueprint Ships A Dated Reference Catalog

The bluepriNNt MUST ship a catalog as kNNowledge with three Concepts. `Provider` carries an id and its request path. `Model` carries a unique canonical id, its provider, one capability (`tts`, `image`, `avatar` or `video`), its declared controls, a reference price with unit and currency, and the price date. `Voice` carries an id, its model, languages and display name. Every Model MUST declare a price and a price date. The catalog MUST NOT contain two ids for the same model.

#### Scenario: Catalog validates

- GIVEN the shipped catalog
- WHEN it is validated against the blueprint
- THEN every Model has a capability, a price and a price date and no id is duplicated

#### Scenario: Unpriced model in the catalog

- GIVEN a catalog Model with no price
- WHEN the catalog is validated
- THEN validation fails naming the model

#### Scenario: Id spelling is reconciled

- GIVEN a script naming `wavespeed/z-image/turbo` while the catalog id is `wavespeed-ai/z-image/turbo`
- WHEN the script is checked
- THEN `unknown-model` names the id and no silent alias is applied

### Requirement: The DomaiNN Allowlists Models And Overrides Prices

A domaiNN MUST be able to declare which catalog models are allowed, add its own Provider, Model and Voice entries, and override a model's price with an invoice price and date. A model not allowed by the domaiNN MUST NOT be used by any run. The domaiNN MUST declare one currency, and every price in the merged catalog MUST use it.

#### Scenario: Override beats reference price

- GIVEN a catalog price of 0.01 and a domaiNN override of 0.012 for the same model
- WHEN the merged catalog is read
- THEN the model's price is 0.012 with source `domain` and the override date

#### Scenario: Disallowed model is refused before spend

- GIVEN a scene resolving a catalog model the domaiNN does not allow
- WHEN `produce` runs
- THEN it fails before any charge naming the model and the allowlist

#### Scenario: Domain adds its own model

- GIVEN a domaiNN entry for a model absent from the reference catalog, with price and date
- WHEN it is allowed and resolved
- THEN the guard, estimator and picklists treat it like a catalog model

### Requirement: One Merged Catalog Feeds Every Consumer

The spend guard, the cost estimator, the console picklists and the intent adapters MUST read the same merged catalog (reference catalog plus domaiNN allowlist, additions and overrides). No model id, price, allowlist or capability MUST be defined in engine code, and capability MUST come from the catalog's declared capability, never from matching a substring of the id.

#### Scenario: Consumers agree

- GIVEN the merged catalog
- WHEN the guard allowlist, the estimator's priced models and a picklist are compared
- THEN the sets of allowed models are equal

#### Scenario: Capability is declared, not guessed

- GIVEN an avatar model whose id contains no known vendor string
- WHEN the engine selects its request mode
- THEN the mode follows the declared controls of the Model

#### Scenario: No literals in code

- GIVEN the engine and skill scripts
- WHEN they are searched for catalog model ids and price constants
- THEN none is found outside test fixtures

### Requirement: Unpriced Or Unknown Models Fail Loudly

A run MUST fail before any spend when a resolved model is not in the merged catalog (`unknown-model`), is not allowed, or has no price (`unpriced-model`). The engine MUST NOT apply a fallback rate.

#### Scenario: Allowed but unpriced

- GIVEN an allowed model with no price after merging
- WHEN `produce` runs
- THEN it fails with `unpriced-model` naming the model
- AND no fallback rate is used and nothing is spent

#### Scenario: Unknown model

- GIVEN a scene resolving `acme/new-model` absent from the merged catalog
- WHEN the estimate is built
- THEN it fails with `unknown-model`

### Requirement: Estimates Report Price Provenance

Every priced line of an estimate MUST state the price, its source (`blueprint` or `domain`) and its date. When a price is older than the staleness threshold, the estimate MUST flag it with a staleness warning; the threshold and its configuration are fixed by design (Q4). A stale price MUST NOT stop a run.

#### Scenario: Provenance shown

- GIVEN an estimate with one blueprint-priced and one domain-priced model
- WHEN it is printed
- THEN each line shows price, source and date

#### Scenario: Stale price warns

- GIVEN a model price dated beyond the threshold
- WHEN the estimate is printed
- THEN that line carries a staleness warning and the estimate is still produced

### Requirement: Intent Adapters Translate Intent Fields

For each model the engine MUST translate the intent fields `voice_speed` and `voice_emotion` into provider parameters using the model's declared controls. When a resolved intent field has no declared control on the resolved model, the run MUST fail before spend with `unsupported-control` naming the field and the model. Intent values MUST NOT be passed raw to a provider.

#### Scenario: Speed is translated

- GIVEN a TTS model declaring a speed control with a range
- WHEN a scene resolves `voice_speed:: 1.1`
- THEN the provider request carries the model's own parameter for speed, derived by the adapter

#### Scenario: Control not declared

- GIVEN a TTS model declaring no emotion control and a scene resolving `voice_emotion:: calm`
- WHEN `produce` runs
- THEN it fails with `unsupported-control` naming `voice_emotion` and the model
- AND no request is made

### Requirement: Blocked Models Are Not Allowlisted (pending Q7)

Once the maintainer confirms that `infinitetalk` is blocked, the reference catalog or the domaiNN allowlist MUST NOT allow `wavespeed-ai/infinitetalk`, and a run resolving it MUST be refused before spend. Until confirmation the model's status is recorded as an open item.

#### Scenario: Blocked model is refused

- GIVEN `infinitetalk` not allowed after confirmation
- WHEN a presenter Layer resolves it as `avatar_model`
- THEN the run fails before spend with the allowlist error
