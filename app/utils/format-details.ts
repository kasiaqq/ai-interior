import type { ChangeDescription } from '#shared/types'

const section = (title: string, items: string[]) => [title, ...items.map((item) => `- ${item}`)].join('\n')

/** Plain text for "Copy details" — readable when pasted into notes or a message. */
export function formatDetails(result: {
  styleLabel: string
  variant: number
  roomLabel: string
  description: ChangeDescription
}): string {
  const { description } = result
  return [
    `${result.styleLabel} · variant ${result.variant} — ${result.roomLabel}`,
    description.summary,
    section('Palette', description.palette.map((c) => `${c.role} ${c.hex}`)),
    section('Key pieces', description.keyPieces),
    section('What changed', description.changes),
    section('Kept exactly as it was', description.kept),
  ].join('\n\n')
}
