import type { ZodType } from 'zod'

/** Reads the first JSON object out of free-form LLM text; null when absent or invalid. */
export function parseLlmJson<T>(text: string, schema: ZodType<T>): T | null {
  const candidate = text.match(/\{[\s\S]*\}/)?.[0]
  if (!candidate) return null
  try {
    const result = schema.safeParse(JSON.parse(candidate))
    return result.success ? result.data : null
  } catch {
    return null
  }
}
