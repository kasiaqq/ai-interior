import type { PhotoAnalysis } from '#shared/types'
import { parseLlmJson } from './llm-json'
import { photoAnalysisSchema } from './schemas'
import { runVisionChat } from './workers-ai'

const PHOTO_CHECK_PROMPT = `You check a photo before an AI restyles the room in it. A good photo: shot from a corner so two walls and the floor are visible, daylight, the whole room in frame, held straight, no filters, no panorama, no people.
Reply with JSON only:
{"verdict":"ok"|"warning","warnings":[short user-facing sentences explaining each problem],"positives":[short phrases like "wide shot","daylight"]}`

const PASS: PhotoAnalysis = { verdict: 'ok', warnings: [], positives: [] }

/** Advisory only: any failure lets the user continue without warnings. */
export async function checkPhotoQuality(photo: Uint8Array): Promise<PhotoAnalysis> {
  try {
    const reply = await runVisionChat({ prompt: PHOTO_CHECK_PROMPT, images: [photo], maxTokens: 400 })
    const analysis = parseLlmJson(reply, photoAnalysisSchema)
    if (!analysis) return PASS
    return analysis.warnings.length ? analysis : { ...analysis, verdict: 'ok' }
  } catch {
    return PASS
  }
}
