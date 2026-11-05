import { PROBLEMS, ROOM_TYPES, STYLES } from '#shared/catalog'
import type { ProblemId, RoomTypeId, StyleId } from '#shared/types'

// Wording validated in spike/ (run-11, DECOR=1). Change it only together with a new spike run.
export function buildImagePrompt(input: { roomType: RoomTypeId; style: StyleId; problem?: ProblemId }): string {
  const reinforcement = input.problem ? PROBLEMS[input.problem].promptReinforcement : ''
  return [
    `Redesign this ${ROOM_TYPES[input.roomType].promptName} in ${STYLES[input.style].promptDescription}.`,
    'Make it beautiful and inspiring: add wall art and mirrors, plants, curtains, rugs and layered lighting that fit the style.',
    'Keep the exact same camera angle, framing and perspective.',
    'Keep the room shell identical: walls, wall positions, room size, ceiling height.',
    'Keep every window identical in position, shape, size and frame colour; curtains, blinds and other window decor may be added.',
    'Keep doors in the same position and shape; the door leaf, handle and colour may change.',
    'Keep the space in front of every door, including balcony doors, clear of furniture, plants and decor.',
    'Mirrors reflect only this room as it is: no windows appear in a mirror unless that window is in the photo.',
    'Keep radiators, water heaters and boilers, pipes and vents, sockets, beams, fireplace, stairs and niches in place; their colour or cover may match the style.',
    'Do not add any new windows, doors or openings, and do not remove existing ones.',
    'Replace everything else to fit the style: furniture, flooring, wall colour and finish, lighting, textiles, decor, built-in cabinetry.',
    'Photorealistic interior photograph with the same light sources as the original.',
    reinforcement,
  ]
    .filter(Boolean)
    .join(' ')
}
