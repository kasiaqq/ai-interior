import { z } from 'zod'
import { PROBLEMS, ROOM_TYPES, STYLES } from '#shared/catalog'
import { AppError, type ErrorCode } from '#shared/errors'
import type { GenerationResponse, ProblemId, RoomTypeId, StyleId } from '#shared/types'
import { parseLlmJson } from './llm-json'
import { buildImagePrompt } from './prompt'
import { changeDescriptionSchema } from './schemas'
import { runImageEdit, runVisionChat } from './workers-ai'

const DESCRIBE_PROMPT = `The first image is the original room, the second is the same room restyled in {STYLE}. Describe the restyled room for the user.
Reply with JSON only:
{"palette":[{"role":"short name like Paper walls or Oak floor","hex":"#RRGGBB"}] (4-5 entries),
"keyPieces":[3-4 short phrases about main furniture and lighting],
"changes":[3 short phrases about what changed versus the original],
"kept":[short phrases about what stayed exactly the same: windows, doors, radiators, room shape],
"summary":"one sentence for mobile"}`

const keysOf = <T extends object>(record: T) => Object.keys(record) as [keyof T & string, ...(keyof T & string)[]]
const sideLength = z.coerce.number().int().min(256).max(1024).multipleOf(16)

const formSchema = z.object({
  width: sideLength,
  height: sideLength,
  roomType: z.enum(keysOf(ROOM_TYPES)),
  style: z.enum(keysOf(STYLES)),
  seed: z.coerce.number().int().nonnegative(),
  problem: z.enum(keysOf(PROBLEMS)).optional(),
})

export interface GenerationInput {
  photo: Uint8Array
  width: number
  height: number
  roomType: RoomTypeId
  style: StyleId
  seed: number
  problem?: ProblemId
}

export function parseGenerationForm(fields: Record<string, string>, photo: Uint8Array | undefined): GenerationInput {
  const parsed = formSchema.safeParse(fields)
  if (!photo || !parsed.success) throw new AppError('INVALID_FILE')
  return { photo, ...parsed.data }
}

export async function generateRestyle(input: GenerationInput): Promise<GenerationResponse> {
  const after = await runImageEdit({
    image: input.photo,
    prompt: buildImagePrompt(input),
    width: input.width,
    height: input.height,
    seed: input.seed,
  })
  const description = await runVisionChat({
    prompt: DESCRIBE_PROMPT.replace('{STYLE}', STYLES[input.style].label),
    images: [input.photo, after],
    maxTokens: 700,
  })
    .then((reply) => parseLlmJson(reply, changeDescriptionSchema))
    .catch(() => null)
  return { image: Buffer.from(after).toString('base64'), description }
}

const STATUS: Record<ErrorCode, number> = { INVALID_FILE: 400, QUOTA_REACHED: 429, GENERATION_FAILED: 502, NETWORK: 502 }
export const statusFor = (code: ErrorCode): number => STATUS[code]
