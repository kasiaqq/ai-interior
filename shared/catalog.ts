import type { ProblemId, RoomTypeId, StyleId } from './types'

export interface StyleDefinition {
  label: string
  description: string
  swatches: string[]
  promptDescription: string
}

export const STYLES: Record<StyleId, StyleDefinition> = {
  japandi: {
    label: 'Japandi',
    description:
      'Japanese restraint on Scandinavian bones: low oak furniture, paper-toned walls, one plant, clear surfaces. Warmer and less grey than the version everyone pinned five years ago.',
    swatches: ['#ECE6DA', '#B88D5E', '#8C9784', '#2A2A27'],
    promptDescription:
      'Japandi as it looks in 2026: Japanese restraint on Scandinavian bones, low light-oak furniture, warm paper-toned walls, linen and wool textiles, one sculptural plant, clear uncluttered surfaces, warm rather than grey',
  },
  scandinavian: {
    label: 'Scandinavian',
    description:
      'Pale wood, wool and daylight as the main light source. Light without going clinical — current Scandi leans on texture and muted blues instead of all-white.',
    swatches: ['#F3F1EC', '#E2CEA8', '#A8B6C1', '#6D7780'],
    promptDescription:
      'Scandinavian as it looks in 2026: pale wood, wool and soft textures, daylight as the main light source, muted blues and warm whites, cosy but not clinical',
  },
  industrial: {
    label: 'Industrial',
    description:
      'Concrete, dark metal and worn leather, kept calm. The current reading is softer: fewer exposed pipes, more matte black, warm wood against the cold surfaces.',
    swatches: ['#9A9A96', '#6B5E4F', '#8A5634', '#2A2A28'],
    promptDescription:
      'Industrial as it looks in 2026: calm and soft, concrete and microcement surfaces, matte black metal, worn leather, warm wood against cool surfaces, few exposed pipes',
  },
  midcentury: {
    label: 'Mid-century modern',
    description:
      'Walnut, tapered legs, burnt orange and teal in small doses. Used sparingly today — a few signature pieces rather than a full period set.',
    swatches: ['#F1E9DA', '#A0703F', '#B45F35', '#2F5E4D'],
    promptDescription:
      'Mid-century modern as it looks in 2026: walnut, tapered legs, burnt orange and teal used sparingly, a few signature pieces rather than a full period set',
  },
}

export const ROOM_TYPES: Record<RoomTypeId, { label: string; promptName: string }> = {
  'living-room': { label: 'Living room', promptName: 'living room' },
  bedroom: { label: 'Bedroom', promptName: 'bedroom' },
  kitchen: { label: 'Kitchen', promptName: 'kitchen' },
  bathroom: { label: 'Bathroom', promptName: 'bathroom' },
  'dining-room': { label: 'Dining room', promptName: 'dining room' },
  'home-office': { label: 'Home office', promptName: 'home office' },
  'kids-room': { label: 'Kids’ room', promptName: 'kids’ room' },
  hallway: { label: 'Hallway', promptName: 'hallway' },
  other: { label: 'Something else', promptName: 'room' },
}

export const PROBLEMS: Record<ProblemId, { label: string; promptReinforcement: string }> = {
  window: {
    label: 'The window changed — size, shape or frame colour',
    promptReinforcement: 'Most important: every window keeps exactly its size, shape, position and frame colour.',
  },
  door: {
    label: 'The door moved or changed shape',
    promptReinforcement: 'Most important: every door stays exactly where it is, with the same shape and size.',
  },
  wall: {
    label: 'The room shape or ceiling is different',
    promptReinforcement: 'Most important: walls, corners and ceiling height stay exactly as in the photo.',
  },
  technical: {
    label: 'A radiator, socket, beam or fireplace is gone',
    promptReinforcement: 'Most important: every radiator, socket, beam and fireplace stays visible in its place.',
  },
  other: { label: 'Something else looks wrong', promptReinforcement: '' },
}
