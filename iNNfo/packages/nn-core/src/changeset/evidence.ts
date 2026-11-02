/**
 * Evidence grammar (changeset-document-model: Evidence accepts a bracketed list).
 *
 * `evidence` is the change's only provenance. It is one citation in the shared
 * grammar, a bracketed list of citations, or one of the keywords `decision` /
 * `unknown` — the keywords only ever alone. The serialized string is what the
 * seal covers, so nothing here rewrites whitespace or order.
 */
import { splitSourceFieldValue } from '../sourceRef.js'

/** The two evidence keywords; valid only as the whole value. */
export const EVIDENCE_KEYWORDS = ['decision', 'unknown'] as const
export type EvidenceKeyword = (typeof EVIDENCE_KEYWORDS)[number]

function isKeyword(value: string): value is EvidenceKeyword {
  return (EVIDENCE_KEYWORDS as readonly string[]).includes(value.toLowerCase())
}

/**
 * The keyword a multi-entry evidence list wrongly contains, or `null` when the
 * list is well formed. `decision` / `unknown` are only valid alone.
 */
export function evidenceKeywordInList(value: unknown): string | null {
  const items = splitSourceFieldValue(value)
  if (items.length < 2) return null
  for (const item of items) {
    if (isKeyword(item)) return item.toLowerCase()
  }
  return null
}

/**
 * Splits an `evidence` value into its entries, in order. Throws
 * `EVIDENCE_KEYWORD_IN_LIST` when a keyword appears beside another entry.
 */
export function splitEvidence(value: unknown): string[] {
  const keyword = evidenceKeywordInList(value)
  if (keyword) {
    throw new Error(
      `EVIDENCE_KEYWORD_IN_LIST: "${keyword}" is only valid alone in evidence; cite the document, or use the keyword by itself`,
    )
  }
  return splitSourceFieldValue(value).map((item) => (isKeyword(item) ? item.toLowerCase() : item))
}
