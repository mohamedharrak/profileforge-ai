export default function Header({ demoMode, onDemoChange, disabled }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#top" aria-label="ProfileForge AI home">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span><strong>ProfileForge <em>AI</em></strong><small>Optimize your LinkedIn profile with AI</small></span>
        </a>
        <label className="mode-control">
          <span><strong>Demo Mode</strong><small>{demoMode ? 'Example results' : 'Live backend'}</small></span>
          <input type="checkbox" role="switch" checked={demoMode} onChange={(event) => onDemoChange(event.target.checked)} disabled={disabled} />
          <span className="switch" aria-hidden="true" />
        </label>
      </div>
    </header>
  )
}
