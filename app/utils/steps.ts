export interface StepState {
  hasPhoto: boolean
  hasRoom: boolean
  hasStyle: boolean
  resultIds: string[]
}

/** Where to send the user when a step is opened without what it needs (e.g. after a refresh). */
export function requiredRedirect(path: string, state: StepState): string | null {
  const resultId = path.match(/^\/result\/([^/]+)/)?.[1]
  const allowed = resultId
    ? state.resultIds.includes(resultId)
    : ({
        '/room': state.hasPhoto,
        '/style': state.hasPhoto && state.hasRoom,
        '/generate': state.hasPhoto && state.hasRoom && state.hasStyle,
        '/results': state.resultIds.length > 0,
      } as Record<string, boolean>)[path] ?? true
  return allowed ? null : '/'
}
