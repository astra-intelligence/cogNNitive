/**
 * Reference rewriting for renames: plain wikilinks and bare/qualified reference
 * values. Pure string helpers with no dependency beyond `slugify`, so the
 * browser-safe changelog can relink lazily without importing the mutation engine
 * or the source-reference grammar.
 */
import { slugify } from './parser/slug.js'

export function updateReferenceString(text: string, oldName: string, newName: string): string {
  if (!text || typeof text !== 'string') return text
  const oldSlug = slugify(oldName)

  // Case 1: Exact match (scalar reference field value without wikilink brackets)
  if (!text.trim().startsWith('[[') && !text.trim().endsWith(']]')) {
    if (slugify(text.trim()) === oldSlug) {
      const leadingSpaces = text.match(/^\s*/)?.[0] || ''
      const trailingSpaces = text.match(/\s*$/)?.[0] || ''
      return `${leadingSpaces}${newName}${trailingSpaces}`
    }
  }

  // Case 2: Qualified scalar string, e.g. "[Model] OldName" or "Model :: OldName"
  if (!text.trim().startsWith('[[') && !text.trim().endsWith(']]')) {
    const qualifiedBracketRegex = new RegExp(`^(\\s*\\[[^\\]]+\\]\\s*)(.+)$`, 'i')
    const matchBracket = text.match(qualifiedBracketRegex)
    if (matchBracket && slugify(matchBracket[2].trim()) === oldSlug) {
      const trailingSpaces = matchBracket[2].match(/\s*$/)?.[0] || ''
      return `${matchBracket[1]}${newName}${trailingSpaces}`
    }

    const qualifiedColonRegex = new RegExp(`^(\\s*[^:]+::\\s*)(.+)$`, 'i')
    const matchColon = text.match(qualifiedColonRegex)
    if (matchColon && slugify(matchColon[2].trim()) === oldSlug) {
      const trailingSpaces = matchColon[2].match(/\s*$/)?.[0] || ''
      return `${matchColon[1]}${newName}${trailingSpaces}`
    }
  }

  // Case 3: Embedded wikilinks: [[Target]] or [[Target|Alias]] or [[Qualified Target]]
  return updateWikiLinks(text, oldName, newName)
}

/** Rewrite only `[[...]]` wikilink references (Case 3 of `updateReferenceString`),
 *  leaving bare string values untouched. Used by the schema-aware rename pass
 *  for fields the parent template does NOT declare as `type:: reference`. */
export function updateWikiLinks(text: string, oldName: string, newName: string): string {
  if (!text || typeof text !== 'string') return text
  const oldSlug = slugify(oldName)

  return text.replace(/\[\[\s*([^\|]+?)(\s*\|[^\]]+)?\s*\]\]/gi, (match, target, alias) => {
    const trimmedTarget = target.trim()

    // Direct match inside wikilink
    if (slugify(trimmedTarget) === oldSlug) {
      return `[[${newName}${alias ?? ''}]]`
    }

    // Qualified match inside wikilink: e.g. "[Model] OldName" or "Model :: OldName"
    const qBracket = new RegExp(`^(\\[[^\\]]+\\]\\s*)(.+)$`, 'i')
    const mBracket = trimmedTarget.match(qBracket)
    if (mBracket && slugify(mBracket[2]) === oldSlug) {
      return `[[${mBracket[1]}${newName}${alias ?? ''}]]`
    }

    const qColon = new RegExp(`^(.*::\\s*)(.+)$`, 'i')
    const mColon = trimmedTarget.match(qColon)
    if (mColon && slugify(mColon[2]) === oldSlug) {
      return `[[${mColon[1]}${newName}${alias ?? ''}]]`
    }

    return match
  })
}
