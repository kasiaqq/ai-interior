import { useSessionStore } from '~/stores/session'
import { requiredRedirect } from '~/utils/steps'

export default defineNuxtRouteMiddleware((to) => {
  const session = useSessionStore()
  const redirect = requiredRedirect(to.path, {
    hasPhoto: !!session.photo,
    hasRoom: !!session.roomType,
    hasStyle: !!session.style,
    resultIds: session.results.map((r) => r.id),
  })
  if (redirect && redirect !== to.path) return navigateTo(redirect)
})
