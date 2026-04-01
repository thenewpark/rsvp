export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false })
  }

  const url = process.env.VITE_APPS_SCRIPT_URL
  if (!url) {
    return res.status(500).json({ ok: false, error: 'APPS_SCRIPT_URL not configured' })
  }

  try {
    // Server-side fetch — no CORS restrictions, can follow Apps Script's redirect freely
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      redirect: 'follow',
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[submit] fetch to Apps Script failed:', err)
    return res.status(500).json({ ok: false })
  }
}
