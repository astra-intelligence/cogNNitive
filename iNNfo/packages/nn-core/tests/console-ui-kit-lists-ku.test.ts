// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const req = createRequire(import.meta.url)
const UI = req(join(import.meta.dirname!, '..', '..', '..', 'specs', 'bluepriNNts', 'console', 'ui-kit.js')) as any

// Spec: console-ui-kit "Renderers Consume the Kit" — DraftList and RelList
// chips are knowledge units built by Ku, keyed by canonical address.
describe('DraftList Ku migration', () => {
  it('renders the draft target as kit-built Ku chips on an element sheet', () => {
    const list = UI.DraftList(
      {
        drafts: [
          { id: 'd1', kind: 'correction', element_id: 'e1', field: 'owner', address: 'm@e1&owner' },
        ],
        byId: { e1: { id: 'e1', name: 'Egon', concept: 'Person' } },
      },
      { modelId: 'm' },
    )
    // A change is an element: the target is named on the sheet, and every chip
    // is a kit Ku unit rather than hand-rolled markup.
    const sheet = list.querySelector('article[data-nn-component="element-card"]')!
    expect(sheet.querySelector('[data-ku-kind="section"]')).not.toBeNull()
    const unit = sheet.querySelector('[data-ku-kind="element"]')!
    // The chip addresses the TARGET unit, so it stays a real, resolvable unit.
    expect(unit.getAttribute('data-ku-address')).toBe('m@e1')
    expect(unit.textContent).toContain('Egon')
  })
})

describe('RelList Ku migration', () => {
  it('renders the relation field and target as Ku units', () => {
    const list = UI.RelList(
      {
        model: 'm',
        relations: [{ field: 'parked-at', target: 'hq', targetLabel: 'HQ' }],
        byId: { hq: { id: 'hq', name: 'HQ' } },
      },
      { modelId: 'm' },
    )
    expect(list.querySelector('[data-ku-kind="field"]')).toBeTruthy()
    const target = list.querySelector('[data-ku-kind="element"]')!
    expect(target.getAttribute('data-ku-address')).toBe('m@hq')
  })
})
