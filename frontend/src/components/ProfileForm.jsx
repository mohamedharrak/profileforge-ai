const fields = [
  { name: 'headline', label: 'Headline', placeholder: 'e.g. Software developer building thoughtful digital products', maxLength: 220 },
  { name: 'about', label: 'About', placeholder: 'Tell us about your background, strengths, and what drives you.', multiline: true, maxLength: 3000 },
  { name: 'experience', label: 'Experience', placeholder: 'Share your roles, responsibilities, projects, and achievements.', multiline: true, maxLength: 5000 },
  { name: 'skills', label: 'Skills', placeholder: 'e.g. React, project management, data analysis', maxLength: 1000 },
  { name: 'jobTitle', label: 'Target job title', placeholder: 'e.g. Frontend Engineer', maxLength: 150 },
  { name: 'jobDescription', label: 'Target job description', placeholder: 'Paste the job description here, including responsibilities and requirements.', multiline: true, maxLength: 10000 },
]

function Field({ field, value, error, onChange }) {
  const props = { id: field.name, name: field.name, value, placeholder: field.placeholder, maxLength: field.maxLength, onChange, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${field.name}-error` : undefined }
  return (
    <div className="field">
      <div className="field-label"><label htmlFor={field.name}>{field.label} {field.name === 'jobDescription' && <span aria-hidden="true">*</span>}</label><span>{value.length.toLocaleString()} / {field.maxLength.toLocaleString()}</span></div>
      {field.multiline ? <textarea {...props} rows={field.name === 'jobDescription' ? 6 : 4} /> : <input {...props} type="text" />}
      {error && <p className="field-error" id={`${field.name}-error`}>{error}</p>}
    </div>
  )
}

export default function ProfileForm({ values, errors, onChange, onSubmit, onClear, onLoadDemo, loading }) {
  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <fieldset disabled={loading}>
        <div className="section-heading"><div><span className="step">1</span><h2>LinkedIn profile</h2></div><p>Add at least 30 characters across these fields; each field is optional.</p></div>
        {fields.slice(0, 4).map((field) => <Field key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={onChange} />)}
        <div className="section-heading target-heading"><div><span className="step">2</span><h2>Career target</h2></div><p>Give your profile a direction to work towards.</p></div>
        {fields.slice(4).map((field) => <Field key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={onChange} />)}
        <div className="form-actions"><button className="button primary" type="submit">✦ &nbsp;{loading ? 'Analyzing profile…' : 'Analyze profile'}</button><button className="button secondary" type="button" onClick={onClear}>Clear form</button><button className="text-button" type="button" onClick={onLoadDemo}>Load demo data</button></div>
        <p className="form-note">Your profile and job description are sent to the configured backend in live mode.</p>
      </fieldset>
    </form>
  )
}
