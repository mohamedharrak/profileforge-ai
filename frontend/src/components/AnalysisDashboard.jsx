import RewriteCard from './RewriteCard'
import SkillGapCard from './SkillGapCard'
import Recommendations from './Recommendations'
import LoadingState from './LoadingState'

export default function AnalysisDashboard({ result, loading, error }) {
  return (
    <section className="dashboard" aria-labelledby="results-title">
      <div className="dashboard-heading"><div><span className="eyebrow">Your results</span><h2 id="results-title">A stronger first impression.</h2><p>Your personalized profile suggestions will appear here.</p></div>{result && <span className={result.demo ? 'result-badge demo' : 'result-badge'}>{result.demo ? 'Demo Results' : 'Analysis complete'}</span>}</div>
      {loading ? <LoadingState /> : error ? <div className="empty-state error-state" role="alert"><span className="empty-icon">!</span><h3>Unable to analyze</h3><p>{error}</p></div> : result ? <div className="results" key={result.id}>
        {result.demo && <div className="demo-notice"><strong>Example output</strong> These fixed demo results illustrate the experience and do not analyze your input. Load demo data to see the matching example.</div>}
        <RewriteCard title="Improved headline" original={result.profile.headline} improved={result.data.headline} />
        <RewriteCard title="Improved About section" original={result.profile.about} improved={result.data.about} />
        <SkillGapCard skills={result.profile.skills} gaps={result.data.skillGaps} />
        <Recommendations suggestions={result.data.suggestions} />
        <p className="results-note">Review all suggestions for accuracy before adding them to your profile.</p>
      </div> : <div className="empty-state"><div className="empty-illustration" aria-hidden="true"><span>✦</span><i /><i /><i /></div><h3>Your next opportunity starts here</h3><p>Fill in your profile and target role, then run an analysis to see suggestions tailored to your goals.</p><div className="empty-hint"><span>✓</span> Headline &amp; About rewrites <span>✓</span> Skill gaps and next steps</div></div>}
    </section>
  )
}
