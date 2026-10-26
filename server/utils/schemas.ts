import { z } from 'zod'

const phrases = z.array(z.string()).default([])

export const photoAnalysisSchema = z.object({
  verdict: z.enum(['ok', 'warning']),
  warnings: phrases,
  positives: phrases,
})

export const changeDescriptionSchema = z.object({
  palette: z
    .array(z.object({ role: z.string(), hex: z.string().regex(/^#[0-9a-f]{6}$/i) }))
    .min(3)
    .max(6),
  keyPieces: z.array(z.string()),
  changes: z.array(z.string()),
  kept: z.array(z.string()),
  summary: z.string(),
})
