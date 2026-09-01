/**
 * Client-side keyword research and generation
 */

const INTENT_MODIFIERS = {
  informational: ['what is', 'how to', 'guide', 'benefits', 'types', 'difference', 'tips', 'explain', 'meaning', 'definition', 'examples', 'ways to'],
  commercial: ['best', 'top', 'review', 'comparison', 'vs', 'versus', 'alternative', 'recommended', 'rated'],
  transactional: ['buy', 'price', 'discount', 'offers', 'online', 'shop', 'store', 'cheap', 'affordable', 'deal', 'coupon', 'order'],
  navigational: ['near me', 'login', 'website', 'official', 'app'],
}

const AUDIENCE_MODIFIERS = ['for beginners', 'for professionals', 'for small business', 'for enterprise', 'for startups']

const BUSINESS_TYPE_MODIFIERS = {
  ecommerce: ['buy online', 'shop', 'price', 'deal', 'free shipping', 'best sellers', 'compare prices'],
  saas: ['free trial', 'pricing', 'demo', 'features', 'integration', 'API', 'enterprise'],
  local: ['near me', 'in my area', 'local', 'reviews', 'contact', 'hours'],
  agency: ['services', 'consulting', 'agency', 'expert', 'hire', 'outsource'],
  blog: ['tutorial', 'guide', 'tips', 'how to', 'explained', 'learn'],
  healthcare: ['treatment', 'doctor', 'clinic', 'appointment', 'symptoms', 'diagnosis'],
  finance: ['invest', 'loan', 'credit', 'savings', 'returns', 'rate'],
  other: [],
}

export function generateKeywords(seed, options = {}) {
  const { country = '', businessType = 'other', websiteContent = '' } = options
  const kw = seed.toLowerCase().trim()
  if (!kw) return []

  const keywords = []
  const seen = new Set()
  const add = (keyword, intent, relevance, source = 'pattern') => {
    const key = keyword.toLowerCase().trim()
    if (seen.has(key) || key === kw) return
    seen.add(key)
    keywords.push({ keyword: key, intent, relevance, source })
  }

  // Extract terms from website content if available
  const siteTerms = extractTermsFromContent(websiteContent)

  // Direct keyword
  add(kw, 'Informational', 85, 'seed')

  // Pattern-based generation
  for (const [intent, modifiers] of Object.entries(INTENT_MODIFIERS)) {
    for (const mod of modifiers) {
      if (intent === 'transactional') {
        add(`${mod} ${kw}`, 'Transactional', 80 + Math.floor(Math.random() * 10), 'pattern')
      } else if (intent === 'informational') {
        add(`${mod} ${kw}`, 'Informational', 70 + Math.floor(Math.random() * 15), 'pattern')
      } else if (intent === 'commercial') {
        add(`${kw} ${mod}`, 'Commercial', 75 + Math.floor(Math.random() * 15), 'pattern')
      } else {
        add(`${kw} ${mod}`, 'Navigational', 50 + Math.floor(Math.random() * 15), 'pattern')
      }
    }
  }

  // Audience modifiers
  for (const mod of AUDIENCE_MODIFIERS) {
    add(`best ${kw} ${mod}`, 'Commercial', 70 + Math.floor(Math.random() * 10), 'audience')
  }

  // Business type modifiers
  const bizMods = BUSINESS_TYPE_MODIFIERS[businessType] || BUSINESS_TYPE_MODIFIERS.other
  for (const mod of bizMods) {
    add(`${kw} ${mod}`, 'Transactional', 75 + Math.floor(Math.random() * 10), 'business')
  }

  // Country-based
  if (country) {
    add(`${kw} in ${country}`, 'Commercial', 72 + Math.floor(Math.random() * 10), 'location')
    add(`best ${kw} in ${country}`, 'Commercial', 75 + Math.floor(Math.random() * 10), 'location')
    add(`${kw} ${country}`, 'Informational', 68 + Math.floor(Math.random() * 10), 'location')
  }

  // Website content-based keywords
  for (const term of siteTerms) {
    add(`${kw} ${term}`, 'Informational', 65 + Math.floor(Math.random() * 15), 'website')
    add(`${term} ${kw}`, 'Informational', 63 + Math.floor(Math.random() * 15), 'website')
    add(`best ${term}`, 'Commercial', 60 + Math.floor(Math.random() * 15), 'website')
  }

  // Long-tail patterns
  add(`how much does ${kw} cost`, 'Informational', 70, 'longtail')
  add(`why use ${kw}`, 'Informational', 65, 'longtail')
  add(`${kw} for small business`, 'Commercial', 68, 'longtail')
  add(`top ${kw} companies`, 'Commercial', 72, 'longtail')
  add(`${kw} vs traditional`, 'Comparison', 70, 'longtail')
  add(`${kw} checklist`, 'Informational', 65, 'longtail')
  add(`is ${kw} worth it`, 'Informational', 67, 'longtail')

  return keywords.map(k => ({
    ...k,
    opportunity: calculateOpportunity(k),
    longtail: k.keyword.split(' ').length >= 4,
    action: 'copy',
  }))
}

function extractTermsFromContent(content) {
  if (!content) return []
  const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase()
  const words = clean.split(/\s+/).filter(w => w.length > 4)

  // Find frequent meaningful words (simple approach)
  const freq = {}
  for (const word of words) {
    if (/^(this|that|with|from|have|been|were|they|their|about|would|could|should|which|there|their|your|more|some|only|than|also|into|over|such|after|before|will|each|made|make|like|than|more|most|much|many|very|well|just|being|other|will|from|were|what|when|were|your|that|this|with|from|have|been|will|more|some|only|than|also|into|over|such|after|before|will|each|made|make|like)$/.test(word)) continue
    if (/^\d+$/.test(word)) continue
    freq[word] = (freq[word] || 0) + 1
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}

function calculateOpportunity(keywordObj) {
  let score = 50

  // Long-tail bonus
  const wordCount = keywordObj.keyword.split(' ').length
  if (wordCount >= 4) score += 15
  else if (wordCount >= 3) score += 10
  else if (wordCount === 1) score -= 10

  // Intent bonus
  if (keywordObj.intent === 'Transactional') score += 12
  else if (keywordObj.intent === 'Commercial') score += 10
  else if (keywordObj.intent === 'Informational') score += 5

  // Specificity bonus
  if (/best|top|review|comparison|vs/.test(keywordObj.keyword)) score += 8
  if (/how to|guide|tips|tutorial/.test(keywordObj.keyword)) score += 5

  // Website source bonus
  if (keywordObj.source === 'website') score += 8

  return Math.min(99, Math.max(10, score + Math.floor(Math.random() * 8)))
}

export function classifyIntent(keyword) {
  const lower = keyword.toLowerCase()
  for (const [intent, modifiers] of Object.entries(INTENT_MODIFIERS)) {
    for (const mod of modifiers) {
      if (lower.includes(mod)) return intent
    }
  }
  if (lower.startsWith('best ') || lower.startsWith('top ') || lower.includes(' vs ') || lower.includes(' review')) return 'Commercial'
  if (lower.startsWith('buy ') || lower.includes('price') || lower.includes('cheap') || lower.includes('online')) return 'Transactional'
  if (lower.startsWith('how ') || lower.startsWith('what ') || lower.startsWith('why ') || lower.includes('guide')) return 'Informational'
  return 'Informational'
}

export function generateQuestionKeywords(seed) {
  const questions = [
    `What is ${seed}?`,
    `How to choose ${seed}?`,
    `How much does ${seed} cost?`,
    `What are the benefits of ${seed}?`,
    `Where to buy ${seed} online?`,
    `How to compare ${seed}?`,
    `What is the best ${seed}?`,
    `Is ${seed} worth the investment?`,
    `How to get the most out of ${seed}?`,
    `What should I look for in a ${seed}?`,
  ]
  return questions
}
