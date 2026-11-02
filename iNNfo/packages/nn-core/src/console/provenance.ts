/**
 * Derived provenance for the console payload.
 *
 * The change is the ONLY provenance of a knowledge unit: a field's origin and a
 * unit's history are derived from the change log (change-provenance), never from
 * a field of the model. `deriveValueHistory` and `deriveFieldOrigin` are the
 * production callers of the log's `history`/`origin`; `detectUnrecordedEdits` is
 * the transitional console drift fingerprint (the validator's `checkProvenance`
 * owns drift from S2a on).
 */
import type { ChangeLog, LoggedChange } from '../changelog/index.js'
import { unitOf } from '../changelog/index.js'

/** One hop of a target's value timeline, in the shared order. */
export interface ValueHop {
  changeId: string
  batch?: string
  op: string
  author?: string
  /** The change's evidence — the sole provenance of this hop. */
  evidence?: string
  appliedAt?: string
  from?: string
  to?: string
}

/** The last change that touched a unit: its author, evidence and resulting value. */
export interface FieldOrigin {
  changeId: string
  batch?: string
  author?: string
  evidence?: string
  appliedAt?: string
  from?: string
  to?: string
}

/** A drift fingerprint: a field whose value does not match the last applied change. */
export interface DriftDiagnostic {
  code: 'EDITED_WITHOUT_RECORD'
  severity: 'warning'
  path: string
  message: string
}

/** A model element as this module needs it. */
export interface ProvenanceElement {
  id: string
  /** Element slug as the engine resolves it; falls back to `id`. */
  slug?: string
  /** Canonical model id of the element's model, when the caller knows it. */
  modelId?: string
  name?: string
  fields?: Record<string, unknown>
}

function hopOf(change: LoggedChange): ValueHop {
  return {
    changeId: change.id,
    batch: change.batch,
    op: change.op,
    author: change.author,
    evidence: change.evidence,
    appliedAt: change.appliedAt,
    from: change.from,
    to: change.to,
  }
}

/** The full value timeline of a unit address (`model@element&field`), oldest first. */
export function deriveValueHistory(log: ChangeLog, unit: string): ValueHop[] {
  return log.history(unit).map(hopOf)
}

/** The origin of a unit address: the last applied change that set it, or null. */
export function deriveFieldOrigin(log: ChangeLog, unit: string): FieldOrigin | null {
  const change = log.origin(unit)
  if (!change) return null
  const { changeId, batch, author, evidence, appliedAt, from, to } = hopOf(change)
  return { changeId, batch, author, evidence, appliedAt, from, to }
}

/**
 * Splits a unit address `model@element&field` into its element part and field.
 * A cell (`model@matrix&row&col`) or a body (`model@slug&#body`) yields no field.
 */
export function splitUnit(unit: string): { modelPart: string; elementPart: string; field?: string } {
  const at = String(unit ?? '').indexOf('@')
  if (at === -1) return { modelPart: '', elementPart: '' }
  const rest = String(unit).slice(at + 1)
  const amp = rest.indexOf('&')
  if (amp === -1) return { modelPart: String(unit).slice(0, at), elementPart: rest }
  const elementPart = rest.slice(0, amp)
  const field = rest.slice(amp + 1)
  if (!elementPart || !field || field.includes('&') || field === '#body') {
    return { modelPart: String(unit).slice(0, at), elementPart }
  }
  return { modelPart: String(unit).slice(0, at), elementPart, field }
}

/**
 * The console drift fingerprint: a field whose current value differs from the
 * `to` of the last applied change targeting it. A field with no targeting change
 * emits nothing.
 *
 * The domain console aggregates elements from several models whose authored
 * target model parts vary, so this transitional fingerprint matches on the
 * element part of the unit address — exact, never punctuation-stripped, so
 * `a-b` and `ab` never collide. `checkProvenance` (change-provenance) owns the
 * model-scoped drift from S2a on and replaces this function.
 */
export function detectUnrecordedEdits(
  elements: ReadonlyArray<ProvenanceElement>,
  log: ChangeLog,
): DriftDiagnostic[] {
  const lastChange = new Map<string, LoggedChange>()
  for (const change of log.all) {
    if (!change.applied) continue
    const unit = unitOf(change)
    const { elementPart, field } = splitUnit(unit)
    if (!elementPart || !field) continue
    lastChange.set(`${elementPart.toLowerCase()}\u0000${field.toLowerCase()}`, change)
  }

  const out: DriftDiagnostic[] = []
  for (const el of elements) {
    if (!el.fields) continue
    const elementPart = el.slug ?? el.id
    for (const [field, current] of Object.entries(el.fields)) {
      const origin = lastChange.get(`${elementPart.toLowerCase()}\u0000${field.toLowerCase()}`)
      if (!origin || origin.to === undefined) continue
      if (String(current ?? '') === String(origin.to ?? '')) continue
      out.push({
        code: 'EDITED_WITHOUT_RECORD',
        severity: 'warning',
        path: `${elementPart}&${field}`,
        message:
          `field "${field}" of "${elementPart}" is "${String(current ?? '')}" but the last applied change ` +
          `sets it to "${origin.to}"; record the change or revert`,
      })
    }
  }
  return out
}
