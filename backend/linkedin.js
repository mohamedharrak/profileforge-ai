import { randomBytes, timingSafeEqual } from 'node:crypto'

const lifetime = 10 * 60 * 1000
export function mapLinkedInProfile(profile) {
  return { name: typeof profile?.name === 'string' ? profile.name.trim().slice(0, 200) : '' }
}

export function createLinkedInRouter(express, config = process.env, fetchImpl = fetch) {
  const router = express.Router()
  const states = new Map()
  const cookieName = 'linkedin_state'
  function settings() {
    const { LINKEDIN_CLIENT_ID: clientId, LINKEDIN_CLIENT_SECRET: secret, LINKEDIN_REDIRECT_URI: redirectUri, FRONTEND_ORIGIN: frontend } = config
    try {
      const callback = new URL(redirectUri)
      const origin = new URL(frontend)
      const safe = (url) => url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
      if (!clientId || !secret || !safe(callback) || callback.pathname !== '/api/linkedin/callback' || callback.search || callback.hash || !safe(origin) || origin.origin !== frontend) return null
      return { clientId, secret, redirectUri, frontend, secure: callback.protocol === 'https:' }
    } catch { return null }
  }
  function finish(res, config, result) {
    const payload = JSON.stringify({ type: 'linkedin-import', ...result }).replace(/</g, '\\u003c')
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" })
    return res.type('html').send(`<!doctype html><title>LinkedIn connection</title><p>You can close this window and return to ProfileForge.</p><script>if(window.opener){window.opener.postMessage(${payload}, ${JSON.stringify(config.frontend).replace(/</g, '\\u003c')});window.close()}</script>`)
  }
  router.get('/start', (_req, res) => {
    const cfg = settings()
    if (!cfg) return res.status(503).send('LinkedIn connection is not configured. Please paste your profile details manually.')
    const now = Date.now()
    for (const [key, expiry] of states) if (expiry <= now) states.delete(key)
    if (states.size >= 1000) return res.status(503).send('LinkedIn connection is temporarily unavailable. Please try again or paste your profile details manually.')
    const state = randomBytes(32).toString('hex')
    states.set(state, now + lifetime)
    res.cookie(cookieName, state, { httpOnly: true, sameSite: 'lax', secure: cfg.secure, maxAge: lifetime, path: '/api/linkedin/callback' })
    res.set('Cache-Control', 'no-store')
    const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
    url.search = new URLSearchParams({ response_type: 'code', client_id: cfg.clientId, redirect_uri: cfg.redirectUri, state, scope: 'openid profile' }).toString()
    return res.redirect(url.href)
  })
  router.get('/callback', async (req, res) => {
    const cfg = settings()
    if (!cfg) return res.status(503).send('LinkedIn connection is not configured. Please paste your profile details manually.')
    res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: cfg.secure, path: '/api/linkedin/callback' })
    const state = typeof req.query.state === 'string' ? req.query.state : ''
    const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || ''
    const expiry = states.get(state)
    states.delete(state)
    const valid = /^[a-f0-9]{64}$/.test(state) && /^[a-f0-9]{64}$/.test(cookie) && timingSafeEqual(Buffer.from(state), Buffer.from(cookie)) && expiry > Date.now()
    if (!valid) return finish(res, cfg, { error: 'LinkedIn connection expired or could not be verified. Please try again.' })
    if (req.query.error) return finish(res, cfg, { error: 'LinkedIn connection was cancelled or denied. You can paste your details manually.' })
    if (typeof req.query.code !== 'string' || !req.query.code) return finish(res, cfg, { error: 'LinkedIn did not return an authorization code. Please try again.' })
    try {
      const tokenResponse = await fetchImpl('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: req.query.code, redirect_uri: cfg.redirectUri, client_id: cfg.clientId, client_secret: cfg.secret }), signal: AbortSignal.timeout(10000) })
      if (!tokenResponse.ok) throw new Error('token exchange failed')
      const token = await tokenResponse.json()
      if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('missing token')
      const response = await fetchImpl('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(10000) })
      if (!response.ok) throw new Error('userinfo failed')
      const profile = mapLinkedInProfile(await response.json())
      if (!profile.name) throw new Error('missing name')
      return finish(res, cfg, { profile })
    } catch {
      return finish(res, cfg, { error: 'Could not import your LinkedIn profile. Check app permissions or paste your details manually.' })
    }
  })
  return router
}
