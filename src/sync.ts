// Placeholder de sync. Troque BASE_URL e implemente endpoints na sua API Node/Express.
const BASE_URL = import.meta.env.VITE_API_URL || ''

export async function pushChanges(payload: any) {
  if (!BASE_URL) return { ok: false, skipped: true }
  const r = await fetch(BASE_URL + '/planner/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

export async function pullChanges(sinceISO?: string) {
  if (!BASE_URL) return { ok: false, skipped: true, changes: {} }
  const url = new URL(BASE_URL + '/planner/sync/pull')
  if (sinceISO) url.searchParams.set('since', sinceISO)
  const r = await fetch(url, { method: 'GET' })
  return r.json()
}
