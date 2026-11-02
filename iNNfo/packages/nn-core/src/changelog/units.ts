/**
 * The unit view over a fold result (change-provenance): the shape consumers read.
 * `units()` yields the live state after the epoch cut, with the rename events
 * recorded after each unit's origin applied lazily.
 */
import {
  applyRelinks,
  splitUnitKey,
  type FoldResult,
  type FoldedUnit,
  type Relink,
  type FoldUnitKind,
} from './fold.js'
import type { LoggedChange } from './index.js'

/** One live knowledge unit: its canonical value and the change that set it. */
export interface UnitState {
  readonly key: string
  readonly kind: FoldUnitKind
  /** Canonical serialized value; never empty (an empty value is absent). */
  readonly value: string
  /** The applied change that set this value (unchanged by a later rename). */
  readonly origin: LoggedChange
  /** Rename events recorded after `origin`, applied to `value`. */
  readonly relinks: readonly Relink[]
}

/** Every live unit, optionally scoped to one model id. */
export function unitsFromFold(fold: FoldResult, model?: string): UnitState[] {
  const out: UnitState[] = []
  for (const unit of fold.units.values()) {
    if (model) {
      const { model: unitModel } = splitUnitKey(unit.key)
      if (unitModel !== model) continue
    }
    const { model: unitModel } = splitUnitKey(unit.key)
    const relinks = fold.relinks.get(unitModel) ?? []
    out.push({
      key: unit.key,
      kind: unit.kind,
      value: applyRelinks(unit, relinks),
      origin: unit.origin,
      relinks,
    })
  }
  return out
}

export type { FoldResult, FoldedUnit, Relink, FoldUnitKind }
