/**
 * SEO Scoring utilities
 */

export function calculateOverallScore(checks) {
  const passed = checks.filter(c => c.status === 'pass').length
  const warnings = checks.filter(c => c.status === 'warning').length
  const total = checks.length || 1
  const score = Math.round(((passed * 1 + warnings * 0.5) / total) * 100)
  return Math.max(0, Math.min(100, score))
}

export function getScoreColor(score) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

export function getScoreLabel(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

export function categorizeScore(score) {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

export function calculateKeywordDensity(text, keyword) {
  if (!text || !keyword) return 0
  const clean = text.toLowerCase()
  const kw = keyword.toLowerCase()
  const count = (clean.match(new RegExp(escapeRegex(kw), 'gi')) || []).length
  const wordCount = clean.split(/\s+/).filter(Boolean).length || 1
  return Math.round((count / wordCount) * 100 * 100) / 100
}

export function countOccurrences(text, term) {
  if (!text || !term) return 0
  return (text.toLowerCase().match(new RegExp(escapeRegex(term.toLowerCase()), 'gi')) || []).length
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getGrade(score) {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 67) return 'D+'
  if (score >= 60) return 'D'
  return 'F'
}
