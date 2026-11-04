import { focusHeading } from '~/utils/focus-heading'

/** Every page change after the first load moves focus to the new heading instead of dropping it on the body. */
export function useFocusOnNavigation() {
  let firstLoad = true
  useNuxtApp().hook('page:finish', () => {
    if (firstLoad) firstLoad = false
    else focusHeading()
  })
}
