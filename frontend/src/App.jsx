import { useState } from 'react'
import './App.css'

const suggestionKeys = new Set([
  'suggestions',
  'aisuggestions',
  'recommendations',
  'improvements',
  'profilesuggestions',
  'actionitems',
])

const skillGapKeys = new Set([
  'skillgaps',
  'skillsgaps',
  'skillgap',
  'gaps',
  'missingskills',
  'skillstodevelop',
  'skillstoimprove',
])

function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z]/g, '')
}

function findResponseField(value, keys) {
  if (!value || typeof value !== 'object') return undefined

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findResponseField(item, keys)
      if (match !== undefined) return match
    }
    return undefined
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (keys.has(normalizeKey(key))) return nestedValue
  }

  for (const nestedValue of Object.values(value)) {
    const match = findResponseField(nestedValue, keys)
    if (match !== undefined) return match
  }

  return undefined
}

function formatLabel(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (character) => character.toUpperCase())
}

function ResponseContent({ value }) {
  if (value === null || value === undefined) {
    return <p className="result-empty">No details were provided for this section.</p>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className="result-empty">No items were returned for this section.</p>
    }

    return (
      <ul className="result-list">
        {value.map((item, index) => (
          <li key={index}>
            <ResponseContent value={item} />
          </li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    return (
      <dl className="result-details">
        {Object.entries(value).map(([key, detail]) => (
          <div className="result-detail" key={key}>
            <dt>{formatLabel(key)}</dt>
            <dd><ResponseContent value={detail} /></dd>
          </div>
        ))}
      </dl>
    )
  }

  return <p className="result-text">{String(value)}</p>
}

function App() {
  const [linkedinProfile, setLinkedinProfile] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResults(null)

    if (!linkedinProfile.trim() || !jobDescription.trim()) {
      setError('Add both your LinkedIn profile and the job description to continue.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinProfile, jobDescription }),
      })
      const responseText = await response.text()
      let payload = responseText

      try {
        payload = responseText ? JSON.parse(responseText) : null
      } catch {
        payload = responseText
      }

      if (!response.ok) {
        const message =
          payload && typeof payload === 'object'
            ? payload.error || payload.message
            : ''
        throw new Error(
          message || `The analysis service returned an error (${response.status}). Please try again.`,
        )
      }

      if (payload === null) {
        throw new Error('The analysis service returned an empty response. Please try again.')
      }

      setResults(payload)
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? 'Could not connect to the analysis service. Check that the backend is running and try again.'
          : requestError instanceof Error
            ? requestError.message
            : 'We could not reach the analysis service. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const suggestions = results === null
    ? undefined
    : findResponseField(results, suggestionKeys)
  const skillGaps = results === null
    ? undefined
    : findResponseField(results, skillGapKeys)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="ProfileLens home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>ProfileLens</span>
        </a>
        <span className="topbar-note">AI career toolkit</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <span className="eyebrow"><span className="eyebrow-dot" /> LINKEDIN PROFILE ANALYZER</span>
        <h1 id="page-title">Make your next move <span>count.</span></h1>
        <p>
          See how your LinkedIn profile stacks up against the role you want.
          Get focused, practical feedback to help you stand out.
        </p>
      </section>

      <div className="workspace">
        <section className="form-card" aria-labelledby="form-title">
          <div className="card-heading">
            <div>
              <span className="step-label">YOUR INPUTS</span>
              <h2 id="form-title">Start with the details</h2>
            </div>
            <span className="private-badge"><span aria-hidden="true">●</span> Private by design</span>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <div className="field">
              <label htmlFor="linkedin-profile">
                LinkedIn Profile <span className="required-note">Required</span>
              </label>
              <p className="field-hint" id="profile-hint">
                Paste your headline, about section, experience, and skills.
              </p>
              <textarea
                id="linkedin-profile"
                name="linkedinProfile"
                value={linkedinProfile}
                onChange={(event) => setLinkedinProfile(event.target.value)}
                placeholder="Paste your LinkedIn profile text here..."
                rows={8}
                aria-describedby="profile-hint"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="job-description">
                Job Description <span className="required-note">Required</span>
              </label>
              <p className="field-hint" id="job-hint">
                Include the role responsibilities and qualifications.
              </p>
              <textarea
                id="job-description"
                name="jobDescription"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job description you want to match..."
                rows={8}
                aria-describedby="job-hint"
                required
              />
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            <button className="analyze-button" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Analyzing your profile...
                </>
              ) : (
                <>
                  Analyze Profile
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
            <p className="form-footnote">Your analysis is generated for this request only.</p>
          </form>
        </section>

        <aside className="guide-card" aria-labelledby="guide-title">
          <div className="guide-icon" aria-hidden="true">✦</div>
          <span className="step-label">A BETTER MATCH STARTS HERE</span>
          <h2 id="guide-title">A little context goes a long way.</h2>
          <p>
            The more detail you share, the more relevant your feedback can be.
            Remove personal contact details before pasting if you prefer.
          </p>
          <div className="guide-divider" />
          <div className="guide-tip">
            <span className="tip-number">01</span>
            <span><strong>Profile</strong> — include measurable wins and key skills.</span>
          </div>
          <div className="guide-tip">
            <span className="tip-number">02</span>
            <span><strong>Role</strong> — use the complete job posting for a closer match.</span>
          </div>
        </aside>
      </div>

      {results !== null && (
        <section className="results-section" aria-labelledby="results-title" aria-live="polite">
          <div className="results-heading">
            <div>
              <span className="step-label">YOUR ANALYSIS</span>
              <h2 id="results-title">A clearer path forward</h2>
            </div>
            <span className="results-badge">Analysis complete</span>
          </div>

          <div className="results-grid">
            <article className="result-card">
              <div className="result-card-heading">
                <span className="result-icon suggestions-icon" aria-hidden="true">✧</span>
                <h3>Profile suggestions</h3>
              </div>
              {suggestions === undefined ? (
                <p className="result-empty">
                  The response did not include a recognized suggestions field. Check the full response below.
                </p>
              ) : (
                <ResponseContent value={suggestions} />
              )}
            </article>

            <article className="result-card">
              <div className="result-card-heading">
                <span className="result-icon gaps-icon" aria-hidden="true">↗</span>
                <h3>Skill gaps</h3>
              </div>
              {skillGaps === undefined ? (
                <p className="result-empty">
                  The response did not include a recognized skill gaps field. Check the full response below.
                </p>
              ) : (
                <ResponseContent value={skillGaps} />
              )}
            </article>
          </div>

          <details className="raw-response">
            <summary>View full backend response</summary>
            <pre>{typeof results === 'string' ? results : JSON.stringify(results, null, 2)}</pre>
          </details>
        </section>
      )}
    </main>
  )
}

export default App
