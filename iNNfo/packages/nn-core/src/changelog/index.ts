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
  /** Applied changes whose unit is `unit`, canonical order. */
  history(unit: string): readonly LoggedChange[]
  /** The last applied change of `unit`, or `undefined` when it has no history. */
  origin(unit: string): LoggedChange | undefined
  /** Removal changes kept as tombstones (filled by the fold). */
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

  constructor(changes: readonly LoggedChange[]) {
    this.all = [...changes].sort(compareChanges)
    for (const change of this.all) {
      if (!change.applied) continue
      const unit = unitOf(change)
      const bucket = this.byUnit.get(unit)
      if (bucket) bucket.push(change)
      else this.byUnit.set(unit, [change])
    }
  }

  history(unit: string): readonly LoggedChange[] {
    return this.byUnit.get(unit) ?? []
  }

  origin(unit: string): LoggedChange | undefined {
    const bucket = this.byUnit.get(unit)
    return bucket && bucket.length > 0 ? bucket[bucket.length - 1] : undefined
  }

  get tombstones(): readonly LoggedChange[] {
    return []
  }
}

/** Builds the log from changes already parsed into their changeset context. */
export function createChangeLog(changes: readonly LoggedChange[]): ChangeLog {
  return new ChangeLogImpl(changes)
}

export type { ChangeItem }
