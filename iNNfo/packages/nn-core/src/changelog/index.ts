/**
 * The change log: the one reader every provenance consumer queries.
 *
 * A knowledge unit carries no provenance of its own. Its history, origin and
 * drift are derived by folding the applied changes whose `resolved_target`
 * points at it (change-provenance). This module owns the ordering, the
 * applied-only filter and (from S2a on) the fold and the evidence index, so no
 * consumer re-implements them.
 *
 * Browser-safe: pure over parsed input. The filesystem reader lives in
 * `node.ts`.
 */
import type { ChangeItem, ChangeOp, ChangeStatus } from '../changeset/types.js'
import { compareChanges } from './order.js'
import { elementKeyOf, foldChanges, type FoldResult } from './fold.js'
import { unitsFromFold, type UnitState } from './units.js'

/** One change as the log exposes it: the change plus its changeset context. */
export interface LoggedChange {
  readonly id: string
  /** Workspace-relative changeset path, POSIX separators. */
  readonly changeset: string
  /** Zero-based document index of the change inside the changeset. */
  readonly index: number
  /** The change's own status, else its changeset's status. */
  readonly status: ChangeStatus
  readonly changesetStatus: ChangeStatus
  /** `applied_at` of the change, else of its changeset. */
  readonly appliedAt?: string
  /** Execution fact: the batch identity, the changeset stem. */
  readonly batch?: string
  readonly author?: string
  readonly op: ChangeOp
  readonly target: string
  /**
   * Execution fact stamped at apply: the canonical unit address. Absent on a
   * change that was never applied; the log then falls back to `target`.
   */
  readonly resolvedTarget?: string
  readonly evidence?: string
  /** Execution fact: one sha256 per evidence item, in evidence order. */
  readonly evidenceSha256?: readonly string[]
  readonly from?: string
  readonly to?: string
  readonly concept?: string
  readonly name?: string
  readonly slug?: string
  readonly notes?: string
  readonly resolution?: string
  readonly fields?: Readonly<Record<string, string>>
  /** The evidence list the change carries, split by the shared grammar. */
  readonly evidenceItems?: readonly string[]
  /** True when this change contributes to derived provenance. */
  readonly applied: boolean
}

/** The provenance view of one workspace, built once and queried by every consumer. */
export interface ChangeLog {
  /** Every change, every status, in canonical order (the review UI lists this). */
  readonly all: readonly LoggedChange[]
  /** Applied changes whose unit is `unit`, canonical order, after the epoch cut. */
  history(unit: string): readonly LoggedChange[]
  /** The last applied change of `unit`, or `undefined` when it has no history. */
  origin(unit: string): LoggedChange | undefined
  /** Live units after the epoch cut (optionally scoped to one model id). */
  units(model?: string): Iterable<UnitState>
  /** Unit keys whose last applied change cleared them (`to:: ''`). */
  readonly cleared: ReadonlySet<string>
  /** Element key -> the change that created or removed it. */
  readonly elements: ReadonlyMap<string, LoggedChange>
  /** The change that created or removed the element at `elementKey`, if any. */
  elementOrigin(elementKey: string): LoggedChange | undefined
  /** Removal changes kept as tombstones. */
  readonly tombstones: readonly LoggedChange[]
}

/**
 * The unit address a change contributes to. Apply stamps `resolved_target`;
 * before stamping exists, the change's own `target` is the address. Never a
 * normalizing comparison: the address is matched by exact string equality.
 */
export function unitOf(change: LoggedChange): string {
  return change.resolvedTarget ?? change.target
}

class ChangeLogImpl implements ChangeLog {
  readonly all: readonly LoggedChange[]
  private readonly byUnit = new Map<string, LoggedChange[]>()
  private readonly fold: FoldResult

  constructor(changes: readonly LoggedChange[]) {
    this.all = [...changes].sort(compareChanges)
    for (const change of this.all) {
      if (!change.applied) continue
      const unit = unitOf(change)
      const bucket = this.byUnit.get(unit)
      if (bucket) bucket.push(change)
      else this.byUnit.set(unit, [change])
    }
    this.fold = foldChanges(this.all)
  }

  /** Applied changes of a unit, cut at the latest add_element of its element. */
  history(unit: string): readonly LoggedChange[] {
    const bucket = this.byUnit.get(unit) ?? []
    const epoch = this.fold.epochs.get(elementKeyOf(unit))
    if (epoch === undefined) return bucket
    return bucket.filter((change) => this.orderOf(change) > epoch)
  }

  origin(unit: string): LoggedChange | undefined {
    // A cleared field/body/cell has no live value, so it has no origin.
    if (!this.fold.units.has(unit)) return undefined
    const bucket = this.history(unit)
    return bucket.length > 0 ? bucket[bucket.length - 1] : undefined
  }

  units(model?: string): Iterable<UnitState> {
    return unitsFromFold(this.fold, model)
  }

  get cleared(): ReadonlySet<string> {
    return this.fold.cleared
  }

  get elements(): ReadonlyMap<string, LoggedChange> {
    return this.fold.elements
  }

  elementOrigin(elementKey: string): LoggedChange | undefined {
    return this.fold.elements.get(elementKey)
  }

  get tombstones(): readonly LoggedChange[] {
    return this.fold.tombstones
  }

  /** Canonical position of a change: its index in the sorted `all` list. */
  private orderOf(change: LoggedChange): number {
    return this.orderIndex.get(change) ?? -1
  }

  private get orderIndex(): Map<LoggedChange, number> {
    if (!this.orderCache) {
      this.orderCache = new Map(this.all.map((change, index) => [change, index]))
    }
    return this.orderCache
  }

  private orderCache?: Map<LoggedChange, number>
}

/** Builds the log from changes already parsed into their changeset context. */
export function createChangeLog(changes: readonly LoggedChange[]): ChangeLog {
  return new ChangeLogImpl(changes)
}

export type { ChangeItem }

export {
  applyRelinks,
  canonicalValue,
  elementKeyOf,
  foldChanges,
  splitUnitKey,
  unitKindOf,
  type FoldedUnit,
  type FoldResult,
  type FoldUnitKind,
  type Relink,
} from './fold.js'
export { unitsFromFold, type UnitState } from './units.js'
export {
  checkProvenance,
  type ProvenanceDiagnostic,
  type ProvenanceModel,
  type ProvenanceOptions,
  type ProvenanceReport,
} from './drift.js'
