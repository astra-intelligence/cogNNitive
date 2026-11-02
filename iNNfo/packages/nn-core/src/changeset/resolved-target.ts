/**
 * The canonical unit address a change resolved to at apply time
 * (change-provenance: Frozen-slug target identity).
 *
 * `resolved_target` is an execution fact: built from the model id (no version
 * token) and the frozen slugs the change addressed, so history survives a
 * rename and never collides across punctuation or models. History and origin
 * match by exact string equality on these addresses.
 */
import { slugifyHeading } from '../sourceRef.js'

/** `acme_V_0-1-0` → `acme`. A version token is never part of a unit address. */
const VERSION_TOKEN_RE = /_V_\d+-\d+-\d+$/

export function canonicalUnitModelId(model: string): string {
  return String(model ?? '')
    .trim()
    .replace(VERSION_TOKEN_RE, '')
}

function assertPresent(value: string, name: string): string {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) throw new TypeError(`resolvedTarget: ${name} cannot be empty`)
  return trimmed
}

/**
 * An axis slug: the frozen slug of the element named by the label, else the
 * label slugified.
 */
export function axisSlug(label: string, frozenSlug?: string): string {
  const frozen = String(frozenSlug ?? '').trim()
  return frozen.length > 0 ? frozen : slugifyHeading(assertPresent(label, 'label'))
}

export const resolvedTarget = {
  /** `model@frozen-slug&field` */
  field(model: string, elementSlug: string, field: string): string {
    return `${canonicalUnitModelId(model)}@${assertPresent(elementSlug, 'elementSlug')}&${assertPresent(field, 'field')}`
  },

  /** `model@frozen-slug&#body` */
  body(model: string, elementSlug: string): string {
    return `${canonicalUnitModelId(model)}@${assertPresent(elementSlug, 'elementSlug')}&#body`
  },

  /** `model@matrix-slug&row-slug&col-slug` */
  cell(model: string, matrixSlug: string, rowSlug: string, colSlug: string): string {
    return (
      `${canonicalUnitModelId(model)}@${assertPresent(matrixSlug, 'matrixSlug')}` +
      `&${assertPresent(rowSlug, 'rowSlug')}&${assertPresent(colSlug, 'colSlug')}`
    )
  },

  /** `model@concept:<Name>` or `model@concept:<Name>&field` */
  concept(model: string, conceptName: string, field?: string): string {
    const base = `${canonicalUnitModelId(model)}@concept:${assertPresent(conceptName, 'conceptName')}`
    return field ? `${base}&${assertPresent(field, 'field')}` : base
  },

  /** `model@frozen-slug` (an element-level change) */
  element(model: string, elementSlug: string): string {
    return `${canonicalUnitModelId(model)}@${assertPresent(elementSlug, 'elementSlug')}`
  },

  /** A workspace-relative artifact path, POSIX separators. */
  artifact(path: string): string {
    return assertPresent(path, 'path').replace(/\\/g, '/')
  },
}
