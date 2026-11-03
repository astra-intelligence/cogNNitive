# Delta for scope-chain

Living spec read: `openspec/specs/scope-chain/spec.md`. The scope chain is explicitly unchanged by this change: `findScopeChain`, the root marker `domaiNN_NN.md`, the `scope: true` sub-scope flag, single-parent containment, `isolate`, nested domaiNN roots, the move-warning rule and element scopes (`scope_elements`) keep their requirements byte for byte. Storage (`concept-storage-declaration`) is orthogonal: it decides where an instance lives; the chain decides from whom it inherits values.

One requirement of this living spec is about model identity, not about the chain, and is replaced by `hierarchical-identity`: "Model Id Collision Resolves via Domain-Relative Path (Option A)". It is the only requirement removed here.

Notes for the reader (not requirements):
- Scope node ids for element scopes (`<doc>#<Concept>/<slug>`, domain-relative) are scope-graph ids, not model ids, and are unchanged.
- The `parent: <field>` lookup of `scope_elements` matches a `[[title]]` reference against titles of elements inside the same document. It is an intra-document lookup, not a cross-model reference, and is left as is. Whether it should move to element slugs for consistency with titles being display-only is a design question (see risks).

## REMOVED Requirements

### Requirement: Model Id Collision Resolves via Domain-Relative Path (Option A)

(Reason: collisions cannot arise by construction once model ids carry their container (`hierarchical-identity`). The stem-or-path flip, the `AMBIGUOUS_MODEL_ID` outcome of bare-stem lookup, and the rule that discovery emits the bare stem when unique and the path when colliding, are removed because they make a file's id depend on which other files exist, and orphan recorded change targets when a collision appears.)
(Migration: use the hierarchical id (`<container chain>/<slug>`) wherever a stem or domain-relative path was used as a model id. Duplicate identity is reported by `placement-validation`. Existing domaiNNs are migrated by a later change.)
