export default function SkillGapCard({ skills, gaps }) {
  const profileSkills = skills.split(/[,\n;]/).map((skill) => skill.trim()).filter(Boolean)
  return (
    <article className="result-card">
      <div className="result-heading"><div><span className="card-icon green" aria-hidden="true">◈</span><h3>Skill gap analysis</h3></div></div>
      <p className="card-description">Compare what you shared with the requirements identified in the job description.</p>
      <div className="skill-group"><h4>Skills in your profile</h4><p>Provided in your skills field</p><div className="chips">{profileSkills.map((skill, index) => <span className="chip skill" key={`${skill}-${index}`}>{skill}</span>)}</div></div>
      <div className="skill-group"><h4>Requirements not evidenced</h4><p>These may be missing from your profile, not necessarily from your experience.</p><div className="chips">{gaps.length ? gaps.map((gap, index) => <span className="chip gap" key={`${gap}-${index}`}>{gap}</span>) : <span className="muted">No gaps identified.</span>}</div></div>
    </article>
  )
}
