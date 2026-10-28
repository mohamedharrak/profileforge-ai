import { demoResult } from '../data/demoData'

// Example output is intentionally fixed and does not analyze the submitted text.
export async function analyzeDemo() {
  await new Promise((resolve) => setTimeout(resolve, 900))
  return demoResult
}
