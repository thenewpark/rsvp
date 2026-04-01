export const config = { runtime: 'edge' }

export default async function handler(
  request: Request,
  context: { waitUntil: (promise: Promise<unknown>) => void },
) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), { status: 405 })
  }

  const url = process.env.VITE_APPS_SCRIPT_URL
  if (!url) {
    return new Response(JSON.stringify({ ok: false, error: 'Not configured' }), { status: 500 })
  }

  const body = await request.json()

  // waitUntil keeps the Edge function alive until the Apps Script write completes,
  // while the response is already on its way to the client.
  context.waitUntil(
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
    }).catch(err => console.error('[submit] Apps Script error:', err)),
  )

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
