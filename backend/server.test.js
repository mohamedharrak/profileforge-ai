import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './server.js'
import { validateResult } from './ai.js'

const valid = { headline: 'React developer', about: 'I build web interfaces.', skillGaps: ['TypeScript'], suggestions: ['Add a real project example.'] }
test('API validates inputs, returns the contract, and protects provider failures', async () => {
  const app = createApp(async () => valid)
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const health = await fetch(`${base}/api/health`)
    assert.deepEqual(await health.json(), { status: 'ok' })
    const send = (body, origin = 'http://localhost:5173') => fetch(`${base}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body) })
    assert.equal((await send({})).status, 400)
    assert.equal((await send({ profileText: 1, jobDescription: 'x'.repeat(30) })).status, 400)
    assert.equal((await send({ profileText: 'x'.repeat(12001), jobDescription: 'x'.repeat(30) })).status, 400)
    const result = await send({ profileText: 'profile '.repeat(6), jobDescription: 'description '.repeat(4) }, 'http://127.0.0.1:5173')
    assert.equal(result.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173')
    assert.deepEqual(await result.json(), valid)
    assert.throws(() => validateResult({ ...valid, skillGaps: [null] }))
    assert.throws(() => validateResult({ ...valid, headline: 'x'.repeat(221) }))
    assert.deepEqual(validateResult({ ...valid, extra: 'discarded' }), valid)
  } finally { server.close() }
})
test('provider errors never leak details', async () => {
  const server = createApp(async () => { throw new Error('private provider details') }).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileText: 'a'.repeat(30), jobDescription: 'b'.repeat(30) }) })
    assert.equal(response.status, 502)
    assert.doesNotMatch(await response.text(), /private provider details/)
  } finally { server.close() }
})
