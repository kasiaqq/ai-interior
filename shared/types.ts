export type StyleId = 'japandi' | 'scandinavian' | 'industrial' | 'midcentury'

export type RoomTypeId =
  | 'living-room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'dining-room'
  | 'home-office'
  | 'kids-room'
  | 'hallway'
  | 'other'

export type ProblemId = 'window' | 'door' | 'wall' | 'technical' | 'other'

export interface PhotoAnalysis {
  verdict: 'ok' | 'warning'
  warnings: string[]
  positives: string[]
}

export interface ChangeDescription {
  palette: { role: string; hex: string }[]
  keyPieces: string[]
  changes: string[]
  kept: string[]
  summary: string
}

export interface GenerationResponse {
  /** Base64-encoded JPEG. */
  image: string
  description: ChangeDescription | null
}
