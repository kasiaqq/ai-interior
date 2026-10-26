const MINUTE = 60_000

export function relativeTime(createdAt: number, now: number): string {
  const minutes = Math.floor((now - createdAt) / MINUTE)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return 'a minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? 'an hour ago' : `${hours} hours ago`
}
