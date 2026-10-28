const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '')
export const linkedInStartUrl = `${baseUrl}/api/linkedin/start`
export const apiOrigin = new URL(baseUrl, window.location.href).origin

export async function analyzeProfile(payload) {
  let response
  try {
    response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Could not reach the backend. Check that it is running and try again, or enable Demo Mode.')
  }

  if (!response.ok) {
    let message
    try { message = (await response.json()).error } catch { /* Keep the generic message. */ }
    throw new Error(typeof message === 'string' ? message : `Analysis failed (HTTP ${response.status}). Please try again.`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The backend returned an invalid response. Please try again.')
  }

  if (!data || typeof data.headline !== 'string' || !data.headline.trim() ||
      typeof data.about !== 'string' || !data.about.trim() ||
      !Array.isArray(data.skillGaps) || !data.skillGaps.every((item) => typeof item === 'string' && item.trim()) ||
      !Array.isArray(data.suggestions) || !data.suggestions.every((item) => typeof item === 'string' && item.trim())) {
    throw new Error('The backend returned an invalid response. Please try again.')
  }
  return data
}
