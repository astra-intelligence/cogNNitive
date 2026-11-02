import { describe, it, expect } from 'vitest'
import { splitEvidence, EVIDENCE_KEYWORDS, evidenceKeywordInList } from '../../src/changeset/evidence.js'

describe('splitEvidence', () => {
  it('splits a bracketed list in order', () => {
    expect(splitEvidence('[sources/import/a.md@## One, kNNowledge/x_NN.md@## NN Goal: A]')).toEqual([
      'sources/import/a.md@## One',
      'kNNowledge/x_NN.md@## NN Goal: A',
    ])
  })

  it('keeps a single citation as a one-item list', () => {
    expect(splitEvidence('sources/import/a.md@## Needs')).toEqual(['sources/import/a.md@## Needs'])
    expect(splitEvidence('[sources/import/a.md@## Needs]')).toEqual(['sources/import/a.md@## Needs'])
  })

  it('accepts a bare path, a csv row and a json pointer', () => {
    expect(splitEvidence('sources/import/a.md')).toEqual(['sources/import/a.md'])
    expect(splitEvidence('sources/import/m.csv@segmento=Enterprise')).toEqual([
      'sources/import/m.csv@segmento=Enterprise',
    ])
    expect(splitEvidence('sources/import/m.json@/a/b')).toEqual(['sources/import/m.json@/a/b'])
  })

  it('returns an empty list for missing, empty or whitespace-only evidence', () => {
    expect(splitEvidence(undefined)).toEqual([])
    expect(splitEvidence('')).toEqual([])
    expect(splitEvidence('   ')).toEqual([])
    expect(splitEvidence('[]')).toEqual([])
  })

  it('accepts the keywords only alone', () => {
    expect(EVIDENCE_KEYWORDS).toEqual(['decision', 'unknown'])
    expect(splitEvidence('decision')).toEqual(['decision'])
    expect(splitEvidence('unknown')).toEqual(['unknown'])
    expect(splitEvidence('DECISION')).toEqual(['decision'])
  })

  it('rejects a keyword inside a list with EVIDENCE_KEYWORD_IN_LIST', () => {
    expect(() => splitEvidence('[decision, sources/import/a.md]')).toThrow(/EVIDENCE_KEYWORD_IN_LIST/)
    expect(() => splitEvidence('[sources/import/a.md, unknown]')).toThrow(/EVIDENCE_KEYWORD_IN_LIST/)
  })

  it('detects a keyword in a list without throwing', () => {
    expect(evidenceKeywordInList('[decision, sources/import/a.md]')).toBe('decision')
    expect(evidenceKeywordInList('[sources/import/a.md, unknown]')).toBe('unknown')
    expect(evidenceKeywordInList('[sources/import/a.md]')).toBeNull()
    expect(evidenceKeywordInList('unknown')).toBeNull()
  })
})
