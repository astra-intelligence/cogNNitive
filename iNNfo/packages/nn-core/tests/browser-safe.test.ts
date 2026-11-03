import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as browserExports from '../src/browser'

const FORBIDDEN_IMPORT_RE =
  /(?:from|import)\s*\(?\s*['"](?:node:)?(?:fs|fs\/promises|path|os|child_process|process)['"]|\bprocess\./

describe('address module is browser-safe', () => {
  const dir = join(__dirname, '..', 'src', 'address')
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))

  it('contains the expected sources', () => {
    expect(files.sort()).toEqual(['format.ts', 'grammar.ts', 'index.ts', 'parse.ts'])
  })

  it.each(['format.ts', 'grammar.ts', 'index.ts', 'parse.ts'])('%s imports no node built-in', (file) => {
    expect(readFileSync(join(dir, file), 'utf8')).not.toMatch(FORBIDDEN_IMPORT_RE)
  })

  it('flags a node import when one is present', () => {
    expect("import { join } from 'node:path'").toMatch(FORBIDDEN_IMPORT_RE)
    expect('import fs from "fs"').toMatch(FORBIDDEN_IMPORT_RE)
  })
})

describe('Browser Entry Point', () => {
  it('exports pure spec resolver functions, interface and errors', () => {
    expect(browserExports).toHaveProperty('getSpecForLevel')
    expect(browserExports).toHaveProperty('getBlueprint')
    expect(browserExports).toHaveProperty('getFormatSpec')
    expect(browserExports).toHaveProperty('getDefiNNe')
    // Interface is typescript-only, but let's check class/error type
    expect(browserExports).toHaveProperty('SpecResolutionError')
  })

  it('does NOT export resolveParentChain', () => {
    expect(browserExports).not.toHaveProperty('resolveParentChain')
  })

  it('exports normalizeSingleKnowledge', () => {
    expect(browserExports).toHaveProperty('normalizeSingleKnowledge')
  })
})
