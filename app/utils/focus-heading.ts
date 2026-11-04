/** Starts keyboard and screen reader users on the new view's heading; the page's own scrolling stays in charge. */
export function focusHeading() {
  const heading = document.querySelector<HTMLElement>('h1')
  if (!heading) return
  heading.tabIndex = -1
  heading.focus({ preventScroll: true })
}
