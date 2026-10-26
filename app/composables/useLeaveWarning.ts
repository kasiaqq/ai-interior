import { useSessionStore } from '~/stores/session'

/** The browser asks before a refresh or close once there is something to lose. */
export function useLeaveWarning() {
  const session = useSessionStore()
  const warn = (event: BeforeUnloadEvent) => event.preventDefault()

  watch(
    () => session.results.length > 0,
    (hasResults) => {
      if (hasResults) window.addEventListener('beforeunload', warn)
      else window.removeEventListener('beforeunload', warn)
    },
    { immediate: true },
  )
}
