import { computed, onScopeDispose, readonly, ref } from 'vue'
import { AppError, type ErrorCode } from '#shared/errors'
import type { ProblemId } from '#shared/types'
import { useSessionStore } from '~/stores/session'
import { requestGeneration } from '~/utils/api'

/** Image (~10 s) plus description (~8 s), measured in the spike. Also shown on the style step. */
export const ESTIMATED_SECONDS = 20

const PROGRESS_CAP = 0.9
const STAGES = 3

export type GenerationState =
  | { status: 'idle' }
  | { status: 'running'; startedAt: number }
  | { status: 'done'; resultId: string }
  | { status: 'failed'; code: ErrorCode }
  | { status: 'cancelled' }

export interface Progress {
  ratio: number
  stage: 0 | 1 | 2
  secondsLeft: number
}

/** The model reports no progress, so it is estimated from elapsed time. */
export function progressAt(elapsedSeconds: number): Progress {
  return {
    ratio: Math.min(PROGRESS_CAP, elapsedSeconds / ESTIMATED_SECONDS),
    stage: Math.min(STAGES - 1, Math.floor(elapsedSeconds / (ESTIMATED_SECONDS / STAGES))) as Progress['stage'],
    secondsLeft: Math.max(0, Math.ceil(ESTIMATED_SECONDS - elapsedSeconds)),
  }
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 31)

export function createGeneration() {
  const state = ref<GenerationState>({ status: 'idle' })
  let controller: AbortController | null = null
  let latestRun = 0
  let lastOptions: { problem?: ProblemId } = {}

  function start(options: { problem?: ProblemId } = {}) {
    const session = useSessionStore()
    const { photo, roomType, style } = session
    if (state.value.status === 'running' || !photo || !roomType || !style) return

    lastOptions = options
    const run = ++latestRun
    controller = new AbortController()
    state.value = { status: 'running', startedAt: Date.now() }

    requestGeneration(
      { photo: photo.blob, width: photo.width, height: photo.height, roomType, style, seed: randomSeed(), problem: options.problem },
      controller.signal,
    )
      .then(({ blob, description }) => {
        if (run !== latestRun) return
        if (session.photo !== photo) {
          state.value = { status: 'cancelled' }
          return
        }
        const result = session.addResult({ style, roomType, blob, description })
        state.value = { status: 'done', resultId: result.id }
      })
      .catch((error: unknown) => {
        if (run !== latestRun) return
        state.value = { status: 'failed', code: error instanceof AppError ? error.code : 'GENERATION_FAILED' }
      })
  }

  function cancel() {
    if (state.value.status !== 'running') return
    latestRun++
    controller?.abort()
    state.value = { status: 'cancelled' }
  }

  /** Runs the last request again, keeping its reported problem. */
  const retry = () => start(lastOptions)

  return { state: readonly(state), start, retry, cancel }
}

let shared: ReturnType<typeof createGeneration> | null = null

/** One generation at a time, shared by the style, generating and result screens. */
export function useGeneration() {
  shared ??= createGeneration()
  const generation = shared

  const now = ref(Date.now())
  const timer = setInterval(() => (now.value = Date.now()), 250)
  onScopeDispose(() => clearInterval(timer))

  const progress = computed<Progress>(() => {
    const state = generation.state.value
    if (state.status === 'done') return { ratio: 1, stage: 2, secondsLeft: 0 }
    if (state.status !== 'running') return progressAt(0)
    return progressAt((now.value - state.startedAt) / 1000)
  })

  return { ...generation, progress }
}
