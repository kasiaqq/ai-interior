import { describe, expect, it } from 'vitest'
import { formatDetails } from '~/utils/format-details'

const text = formatDetails({
  styleLabel: 'Japandi',
  variant: 1,
  roomLabel: 'Living room',
  description: {
    palette: [
      { role: 'Paper walls', hex: '#F5E9DC' },
      { role: 'Oak floor', hex: '#C39A6B' },
      { role: 'Sage', hex: '#8C9784' },
    ],
    keyPieces: ['Low sage sofa'],
    changes: ['Carpet replaced with oak'],
    kept: ['Radiator under the window'],
    summary: 'A calm room.',
  },
})

describe('formatDetails', () => {
  it('starts with the result name and room', () => {
    expect(text.startsWith('Japandi · variant 1 — Living room')).toBe(true)
  })

  it('lists the palette with hex codes', () => {
    expect(text).toContain('Paper walls #F5E9DC')
  })

  it('has every section with its items', () => {
    expect(text).toContain('Key pieces\n- Low sage sofa')
    expect(text).toContain('What changed\n- Carpet replaced with oak')
    expect(text).toContain('Kept exactly as it was\n- Radiator under the window')
  })
})
