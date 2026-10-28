import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './server.js'
import { mapLinkedInProfile } from './linkedin.js'

const config = { LINKEDIN_CLIENT_ID: 'test-client', LINKEDIN_CLIENT_SECRET: 'test-secret', LINKEDIN_REDIRECT_URI: 'http://localhost:3001/api/linkedin/callback', FRONTEND_ORIGIN: 'http://localhost:5173' }
async function withServer(fetcher, run) {
  let analyses = 0
  const server = createApp(async (profile, job) => { analyses++; return { profile, job } }, config, fetcher).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  try { await run(`http://127.0.0.1:${server.address().port}`, () => analyses) } finally { server.close() }
}
async function start(base) {
  const response = await fetch(`${base}/api/linkedin/start`, { redirect: 'manual' })
  const url = new URL(response.headers.get('location'))
  return { state: url.searchParams.get('state'), cookie: response.headers.get('set-cookie').split(';')[0], url }
}
test('profile mapping only imports a bounded name', () => {
  assert.deepEqual(mapLinkedInProfile({ name: '  Jane Doe  ', headline: 'ignored', email: 'ignored' }), { name: 'Jane Doe' })
  assert.equal(mapLinkedInProfile({ name: 1 }).name, '')
  assert.equal(mapLinkedInProfile({ name: 'x'.repeat(300) }).name.length, 200)
})
test('OAuth state is browser-bound, expires on use, and rejects invalid callbacks', async () => {
  await withServer(() => { throw new Error('must not call provider') }, async (base) => {
    const flow = await start(base)
    assert.equal(flow.url.searchParams.get('scope'), 'openid profile')
    assert.match(flow.cookie, /^linkedin_state=[a-f0-9]{64}$/)
    const bad = await fetch(`${base}/api/linkedin/callback?state=${flow.state}&code=x`)
    assert.match(await bad.text(), /could not be verified/)
    const replay = await fetch(`${base}/api/linkedin/callback?state=${flow.state}&code=x`, { headers: { cookie: flow.cookie } })
    assert.match(await replay.text(), /could not be verified/)
    const denied = await start(base)
    const denial = await fetch(`${base}/api/linkedin/callback?state=${denied.state}&error=access_denied`, { headers: { cookie: denied.cookie } })
    assert.match(await denial.text(), /cancelled or denied/)
    const missing = await start(base)
    assert.match(await (await fetch(`${base}/api/linkedin/callback?state=${missing.state}`, { headers: { cookie: missing.cookie } })).text(), /did not return an authorization code/)
  })
})
test('callback maps userinfo without exposing tokens or invoking analysis', async () => {
  const calls = []
  await withServer(async (url) => {
    calls.push(url)
    return new Response(JSON.stringify(url.includes('accessToken') ? { access_token: 'private-token' } : { name: 'Jane Doe', email: 'private-email' }), { status: 200 })
  }, async (base, analyses) => {
    const flow = await start(base)
    const response = await fetch(`${base}/api/linkedin/callback?state=${flow.state}&code=code`, { headers: { cookie: flow.cookie } })
    const html = await response.text()
    assert.match(html, /Jane Doe/)
    assert.doesNotMatch(html, /private-token|private-email/)
    assert.equal(analyses(), 0)
    assert.equal(calls.length, 2)
    const manual = await fetch(`${base}/api/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profileText: 'manual profile '.repeat(4), jobDescription: 'job description '.repeat(4) }) })
    assert.equal(manual.status, 200)
    assert.equal(analyses(), 1)
  })
})
test('provider failures are generic and manual analysis remains available', async () => {
  await withServer(async () => new Response('sensitive provider details', { status: 400 }), async (base) => {
    const flow = await start(base)
    const html = await (await fetch(`${base}/api/linkedin/callback?state=${flow.state}&code=code`, { headers: { cookie: flow.cookie } })).text()
    assert.match(html, /Could not import/)
    assert.doesNotMatch(html, /sensitive provider details|test-secret/)
  })
  const server = createApp(async () => ({}), {}).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    const base = `http://127.0.0.1:${server.address().port}`
    assert.equal((await fetch(`${base}/api/linkedin/start`)).status, 503)
    assert.equal((await fetch(`${base}/api/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profileText: 'a'.repeat(30), jobDescription: 'b'.repeat(30) }) })).status, 200)
  } finally { server.close() }
})
