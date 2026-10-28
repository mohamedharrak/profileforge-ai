import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { analyze } from './ai.js'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true })
export function createApp(analyzer = analyze) {
  const app = express()
  app.use(cors({ origin(origin, callback) {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) || (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN)) return callback(null, true)
    return callback(null, false)
  } }))
  app.use(express.json({ limit: '32kb' }))
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
  app.post('/api/analyze', async (req, res) => {
    const { profileText, jobDescription } = req.body || {}
    if (typeof profileText !== 'string' || profileText.trim().length < 30 || profileText.length > 12000 || typeof jobDescription !== 'string' || jobDescription.trim().length < 30 || jobDescription.length > 10500) {
      return res.status(400).json({ error: 'Provide at least 30 characters of profile content and job description within the size limits.' })
    }
    try {
      return res.json(await analyzer(profileText.trim(), jobDescription.trim()))
    } catch (error) {
      if (error.code === 'CONFIG') return res.status(503).json({ error: 'AI service is not configured.' })
      if (error.status === 429 || error.statusCode === 429) return res.status(429).json({ error: 'AI service rate limit reached. Please try again later.' })
      return res.status(502).json({ error: 'AI service could not complete the analysis. Please try again.' })
    }
  })
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' })
    if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'Invalid JSON request.' })
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  })
  return app
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 3001)
  createApp().listen(port, () => console.log(`ProfileForge API listening on port ${port}`))
}
