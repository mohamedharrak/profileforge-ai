import { useState } from 'react'
import Header from './components/Header'
import ProfileForm from './components/ProfileForm'
import AnalysisDashboard from './components/AnalysisDashboard'
import { demoProfile } from './data/demoData'
import { analyzeProfile } from './services/api'
import { analyzeDemo } from './services/mockApi'
import './App.css'

const emptyProfile = { headline: '', about: '', experience: '', skills: '', jobTitle: '', jobDescription: '' }

function App() {
  const [values, setValues] = useState(emptyProfile)
  const [errors, setErrors] = useState({})
  const [demoMode, setDemoMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setResult(null)
    setError('')
  }

  function resetResults() { setResult(null); setError('') }
  function handleClear() { setValues(emptyProfile); setErrors({}); resetResults() }
  function handleLoadDemo() { setValues({ ...demoProfile }); setErrors({}); resetResults() }
  function handleModeChange(value) { setDemoMode(value); resetResults() }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if ([values.headline, values.about, values.experience, values.skills].join(' ').trim().length < 30) nextErrors.headline = 'Provide at least 30 characters across your profile fields.'
    if (values.jobDescription.trim().length < 30) nextErrors.jobDescription = 'Provide at least 30 characters of job description.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }
    setLoading(true)
    resetResults()
    const profile = { ...values }
    const profileText = `Headline: ${profile.headline}\n\nAbout: ${profile.about}\n\nExperience: ${profile.experience}\n\nSkills: ${profile.skills}`
    const jobDescription = `Target job title: ${profile.jobTitle}\n\n${profile.jobDescription}`
    try {
      const data = demoMode ? await analyzeDemo() : await analyzeProfile({ profileText, jobDescription })
      setResult({ data, profile, demo: demoMode, id: Date.now() })
    } catch (caught) {
      setError(caught.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <div id="top"><Header demoMode={demoMode} onDemoChange={handleModeChange} disabled={loading} /><main className="page"><div className="intro"><div><div className="intro-label"><span /> YOUR PROFILE WORKSPACE</div><h1>Make your profile<br /><span>work for you.</span></h1><p>Turn your experience into a LinkedIn profile that speaks to your next opportunity.</p></div><div className="intro-aside"><span className="aside-icon">✧</span><div><strong>Made for your next move</strong><p>Thoughtful suggestions, tailored to the role you want.</p></div></div></div><div className="workspace"><div><div className="column-heading"><div><h2>Your profile</h2><p>Tell us about yourself and the role you're aiming for.</p></div><span className="required-note">Profile details and job description required</span></div><ProfileForm values={values} errors={errors} onChange={handleChange} onSubmit={handleSubmit} onClear={handleClear} onLoadDemo={handleLoadDemo} loading={loading} /></div><AnalysisDashboard result={result} loading={loading} error={error} /></div></main><footer><span>✦ &nbsp;ProfileForge AI</span><span>Built for the next step in your career.</span></footer></div>
}

export default App
