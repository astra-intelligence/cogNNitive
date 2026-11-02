/**
 * Changeset → console element history and per-field provenance.
 *
 * The generated console shows a "Changeset Lineage & Revision History" section
 * per element (ui-kit.js), reading `element.history`, and the origin icon per
 * field, reading `element.provenance`. The console is static and offline, so
 * both are embedded in the payload, exactly like citations.
 *
 * Both are derived from the change log (`changelog/`), never from a field of the
 * model: history is the applied changes per unit, origin is the last one.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseChangeset } from '../changeset/parser.js'
import type { ChangeItem } from '../changeset/types.js'
import { isNNName, isSidecarName, parseName } from '../naming/contract.js'
import type { ResolvedCitation } from './citations.js'
import { buildChangeLogFromChangesets, type ChangesetLike } from '../changelog/load.js'
import type { LoggedChange } from '../changelog/index.js'
import { unitOf } from '../changelog/index.js'
import { deriveFieldOrigin, deriveValueHistory } from './provenance.js'
import type { FieldOrigin, ValueHop } from './provenance.js'

/** One lineage entry as the console modal renders it (a change card). */
export interface ElementHistoryItem {
  id: string
  op: string
  /** The unit address the change touched. */
  target?: string
  author?: string
  timestamp?: string
  notes?: string
  status?: string
  /** The evidence the change derives from (its proposal-time `evidence`). */
  evidence?: string
  /** The evidence resolved to a citation entry (for the icon's dialog), when a resolver ran. */
  evidenceCitation?: ResolvedCitation
  /** Diff / payload for the change card. */
  from?: string
  to?: string
  concept?: string
  name?: string
  fields?: Record<string, string>
  resolution?: string
}

/** A field unit's value timeline and its origin, derived from applied changes. */
export interface UnitProvenance {
  history: ValueHop[]
  origin: FieldOrigin | null
}

interface ChangesetChangeRecord {
  id: string
  op: string
  target: string
  author?: string
  notes?: string
  status?: string
  evidence?: string
  applied_at?: string
  batch?: string
  resolved_target?: string
  /** Card data for the Changes tab: the diff, the added fields and the reason. */
  from?: string
  to?: string
  concept?: string
  name?: string
  fields?: Record<string, string>
  resolution?: string
}

/** A parsed changeset reduced to what element history needs. */
export interface ChangesetRecord {
  path: string
  title?: string
  status?: string
  author?: string
  appliedAt?: string
  resolution?: string
  changes: ChangesetChangeRecord[]
}

/** Structural element shape this module needs (avoids importing payload-builder). */
interface HistoryBearingElement {
  id: string
  name: string
  slug?: string
  history?: ElementHistoryItem[]
  /** Per field with an applied change: its applied history and origin. */
  provenance?: Record<string, UnitProvenance>
}

/** A `changes/` document: an `_NN.md` file (not a sidecar) whose stem ends in `_changes`. */
function isChangesetFile(name: string): boolean {
  if (!isNNName(name) || isSidecarName(name)) return false
  const parsed = parseName(name)
  return parsed.kind === 'nn' && parsed.stem.endsWith('_changes')
}

/** Splits a unit address `model@element&field` into its model and element parts. */
export function parseChangesetTarget(target: string): { modelPart: string; elementPart: string } {
  const at = String(target || '').indexOf('@')
  if (at === -1) return { modelPart: '', elementPart: '' }
  const rest = String(target).slice(at + 1)
  return {
    modelPart: String(target).slice(0, at).trim(),
    elementPart: rest.split('&')[0].trim(),
  }
}

/** The field part of a field unit address, or `undefined` for a cell, body or bare unit. */
function fieldOfUnit(unit: string): string | undefined {
  const at = String(unit).indexOf('@')
  if (at === -1) return undefined
  const rest = String(unit).slice(at + 1)
  const amp = rest.indexOf('&')
  if (amp === -1) return undefined
  const field = rest.slice(amp + 1)
  if (!field || field.includes('&')) return undefined
  return field
}

function stripWrappingQuotes(value?: string): string | undefined {
  if (typeof value !== 'string') return value
  const t = value.trim()
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1)
  return value
}

/**
 * Reads every `changes/*_changes_NN.md` document under `rootDir` (sorted by file
 * name) and reduces it to a `ChangesetRecord`. Every status is kept: the review
 * UI lists them all (`changeLog().all`).
 */
export async function loadChangesetRecords(rootDir: string): Promise<ChangesetRecord[]> {
  const dir = join(rootDir, 'changes')
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return []
  }
  const records: ChangesetRecord[] = []
  for (const name of names.filter(isChangesetFile).sort()) {
    let raw: string
    try {
      raw = await readFile(join(dir, name), 'utf-8')
    } catch {
      continue
    }
    let doc
    try {
      doc = parseChangeset(raw)
    } catch {
      continue
    }
    const fm = doc.frontmatter as Record<string, unknown>
    records.push({
      path: `changes/${name}`,
      title: fm.title as string | undefined,
      status: fm.status as string | undefined,
      author: fm.author as string | undefined,
      appliedAt: fm.applied_at as string | undefined,
      resolution: fm.resolution as string | undefined,
      changes: doc.changes.map((c) => ({
        id: c.id,
        op: c.op,
        target: c.target,
        author: c.author,
        notes: c.notes,
        status: c.status,
        evidence: c.evidence,
        applied_at: c.applied_at,
        batch: c.batch,
        // Stamped by apply from S1b on; the console reads a persisted changeset.
        resolved_target: (c as ChangeItem & { resolved_target?: string }).resolved_target,
        from: c.from,
        to: c.to,
        concept: c.concept,
        name: c.name,
        fields: c.fields,
        resolution: c.resolution,
      })),
    })
  }
  return records
}

function historyItem(change: LoggedChange, resolveEvidence?: (evidence: string) => ResolvedCitation): ElementHistoryItem {
  return {
    id: change.id,
    op: change.op,
    target: unitOf(change),
    author: change.author,
    timestamp: change.appliedAt,
    notes: stripWrappingQuotes(change.notes),
    status: change.status,
    evidence: change.evidence,
    ...(change.evidence && resolveEvidence ? { evidenceCitation: resolveEvidence(change.evidence) } : {}),
    from: change.from,
    to: change.to,
    concept: change.concept,
    name: change.name,
    fields: change.fields ? { ...change.fields } : undefined,
    resolution: change.resolution,
  }
}

/**
 * Attaches `history` (every status, for the Changes tab) and `provenance`
 * (applied-only, per field, for the origin icon) to every element whose slug,
 * id or name matches the element part of a change's unit address. Matching is
 * exact on the element part, so `a-b` and `ab` never collide. Mutates `elements`.
 */
export function attachChangesetHistory(
  elements: HistoryBearingElement[],
  changesets: ChangesetRecord[] | undefined,
  resolveEvidence?: (evidence: string) => ResolvedCitation,
): void {
  if (!Array.isArray(changesets) || changesets.length === 0) return
  const log = buildChangeLogFromChangesets(changesets as unknown as ChangesetLike[])
  if (log.all.length === 0) return

  for (const el of elements) {
    const keys = new Set(
      [el.slug, el.id, el.name]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .map((value) => value.toLowerCase()),
    )
    if (keys.size === 0) continue

    const provenance: Record<string, UnitProvenance> = {}
    for (const change of log.all) {
      const unit = unitOf(change)
      const { elementPart } = parseChangesetTarget(unit)
      if (!elementPart || !keys.has(elementPart.toLowerCase())) continue
      if (!el.history) el.history = []
      el.history.push(historyItem(change, resolveEvidence))
      if (!change.applied) continue
      const field = fieldOfUnit(unit)
      if (!field || provenance[field]) continue
      provenance[field] = {
        history: deriveValueHistory(log, unit),
        origin: deriveFieldOrigin(log, unit),
      }
    }
    if (Object.keys(provenance).length > 0) el.provenance = provenance
  }
}
