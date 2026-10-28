import { useState } from 'react'

export default function RewriteCard({ title, original, improved }) {
  const [copyState, setCopyState] = useState('')
  async function copyText() {
    try {
      await navigator.clipboard.writeText(improved)
      setCopyState('Copied')
    } catch {
      setCopyState('Copy failed; select the text to copy')
    }
  }
  return (
    <article className="result-card rewrite-card">
      <div className="result-heading"><div><span className="card-icon" aria-hidden="true">✦</span><h3>{title}</h3></div><button type="button" className="copy-button" onClick={copyText}>⧉ &nbsp;Copy</button></div>
      <div className="rewrite-block original"><span>Original</span><p>{original || 'Not provided'}</p></div>
      <div className="rewrite-block improved"><span>Suggested rewrite</span><p>{improved}</p></div>
      <span className="copy-status" role="status">{copyState}</span>
    </article>
  )
}
