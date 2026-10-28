export default function Recommendations({ suggestions }) {
  return <article className="result-card"><div className="result-heading"><div><span className="card-icon amber" aria-hidden="true">↗</span><h3>Recommendations</h3></div></div><p className="card-description">Practical next steps to strengthen your profile.</p>{suggestions.length ? <ol className="recommendations">{suggestions.map((suggestion, index) => <li key={`${suggestion}-${index}`}><span>{index + 1}</span><p>{suggestion}</p></li>)}</ol> : <p className="muted">No recommendations returned.</p>}</article>
}
