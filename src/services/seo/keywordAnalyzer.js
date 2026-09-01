/**
 * Client-side keyword research and generation
 * Extracts meaningful terms from website content and generates contextual keywords
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

// Common stop words to filter out
const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'about',
  'would', 'could', 'should', 'which', 'there', 'your', 'more', 'some', 'only',
  'than', 'also', 'into', 'over', 'such', 'after', 'before', 'will', 'each',
  'made', 'make', 'like', 'just', 'being', 'other', 'what', 'when', 'where',
  'how', 'its', 'can', 'may', 'must', 'shall', 'does', 'done', 'did', 'was',
  'are', 'is', 'has', 'had', 'get', 'got', 'but', 'not', 'you', 'all', 'any',
  'our', 'his', 'her', 'she', 'him', 'who', 'own', 'now', 'new', 'old',
  'one', 'two', 'three', 'first', 'last', 'next', 'well', 'back', 'even',
  'still', 'very', 'much', 'most', 'many', 'here', 'then', 'thus', 'thus',
  'than', 'too', 'also', 'just', 'only', 'ever', 'yet', 'already',
])

/**
 * Main keyword generation function
 */
export function generateKeywords(seed, options = {}) {
  const { country = '', businessType = 'other', websiteContent = '' } = options
  const kw = seed.toLowerCase().trim()
  if (!kw) return []

  const keywords = []
  const seen = new Set()
  const add = (keyword, intent, relevance, source = 'pattern') => {
    const key = keyword.toLowerCase().trim()
    if (seen.has(key) || key === kw || key.length < 3) return
    seen.add(key)
    keywords.push({ keyword: key, intent, relevance, source })
  }

  // Extract rich terms from website content
  const siteData = extractWebsiteData(websiteContent)
  const siteTerms = siteData.terms
  const sitePhrases = siteData.phrases
  const siteHeadings = siteData.headings
  const siteMeta = siteData.meta

  // Direct keyword
  add(kw, 'Informational', 85, 'seed')

  // ─── Website content-based keywords (highest priority) ───
  // Use headings to generate highly relevant keywords
  for (const heading of siteHeadings.slice(0, 10)) {
    const headingClean = heading.toLowerCase().replace(/[^\w\s]/g, '').trim()
    if (headingClean.length > 5 && headingClean.length < 80) {
      add(headingClean, 'Informational', 88, 'website-heading')
    }
  }

  // Use extracted phrases to create keyword combinations
  for (const phrase of sitePhrases.slice(0, 15)) {
    add(`${kw} ${phrase}`, 'Commercial', 82, 'website-phrase')
    add(`${phrase} ${kw}`, 'Informational', 78, 'website-phrase')
    add(`best ${phrase}`, 'Commercial', 75, 'website-phrase')
    add(`${phrase} services`, 'Commercial', 73, 'website-phrase')
    add(`${phrase} guide`, 'Informational', 70, 'website-phrase')
  }

  // Use meta description for context
  if (siteMeta) {
    const metaTerms = siteMeta.split(/\s+/).filter(w => w.length > 4 && !STOP_WORDS.has(w)).slice(0, 8)
    for (const term of metaTerms) {
      add(`${kw} ${term}`, 'Informational', 76, 'website-meta')
      add(`${term} ${kw}`, 'Informational', 74, 'website-meta')
    }
  }

  // Use individual site terms
  for (const term of siteTerms.slice(0, 12)) {
    add(`${kw} ${term}`, 'Informational', 72, 'website')
    add(`${term} ${kw}`, 'Commercial', 70, 'website')
    add(`best ${term}`, 'Commercial', 68, 'website')
    add(`${term} services`, 'Commercial', 65, 'website')
  }

  // ─── Pattern-based keywords ───
  for (const [intent, modifiers] of Object.entries(INTENT_MODIFIERS)) {
    for (const mod of modifiers) {
      if (intent === 'transactional') {
        add(`${mod} ${kw}`, 'Transactional', 78 + Math.floor(Math.random() * 10), 'pattern')
      } else if (intent === 'informational') {
        add(`${mod} ${kw}`, 'Informational', 68 + Math.floor(Math.random() * 12), 'pattern')
      } else if (intent === 'commercial') {
        add(`${kw} ${mod}`, 'Commercial', 73 + Math.floor(Math.random() * 12), 'pattern')
      } else {
        add(`${kw} ${mod}`, 'Navigational', 50 + Math.floor(Math.random() * 12), 'pattern')
      }
    }
  }

  // Audience modifiers
  for (const mod of AUDIENCE_MODIFIERS) {
    add(`best ${kw} ${mod}`, 'Commercial', 68 + Math.floor(Math.random() * 10), 'audience')
  }

  // Business type modifiers
  const bizMods = BUSINESS_TYPE_MODIFIERS[businessType] || BUSINESS_TYPE_MODIFIERS.other
  for (const mod of bizMods) {
    add(`${kw} ${mod}`, 'Transactional', 73 + Math.floor(Math.random() * 10), 'business')
  }

  // Country-based
  if (country) {
    add(`${kw} in ${country}`, 'Commercial', 72 + Math.floor(Math.random() * 10), 'location')
    add(`best ${kw} in ${country}`, 'Commercial', 75 + Math.floor(Math.random() * 10), 'location')
    add(`${kw} ${country}`, 'Informational', 68 + Math.floor(Math.random() * 10), 'location')
    add(`top ${kw} companies in ${country}`, 'Commercial', 70 + Math.floor(Math.random() * 10), 'location')
    add(`${kw} services in ${country}`, 'Commercial', 68 + Math.floor(Math.random() * 10), 'location')
  }

  // Long-tail patterns
  add(`how much does ${kw} cost`, 'Informational', 70, 'longtail')
  add(`why use ${kw}`, 'Informational', 65, 'longtail')
  add(`${kw} for small business`, 'Commercial', 68, 'longtail')
  add(`top ${kw} companies`, 'Commercial', 72, 'longtail')
  add(`${kw} vs traditional`, 'Comparison', 70, 'longtail')
  add(`${kw} checklist`, 'Informational', 65, 'longtail')
  add(`is ${kw} worth it`, 'Informational', 67, 'longtail')
  add(`how to choose ${kw}`, 'Commercial', 74, 'longtail')
  add(`${kw} pros and cons`, 'Comparison', 72, 'longtail')
  add(`${kw} for beginners guide`, 'Informational', 66, 'longtail')

  // Comparison keywords with website terms
  for (const term of siteTerms.slice(0, 5)) {
    add(`${kw} vs ${term}`, 'Comparison', 68, 'comparison')
    add(`${kw} or ${term}`, 'Comparison', 65, 'comparison')
  }

  return keywords.map(k => ({
    ...k,
    opportunity: calculateOpportunity(k),
    longtail: k.keyword.split(' ').length >= 4,
    action: 'copy',
  }))
}

/**
 * Extract rich data from website HTML content
 */
function extractWebsiteData(html) {
  if (!html) return { terms: [], phrases: [], headings: [], meta: '' }

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')

    // Extract headings (h1-h3)
    const headings = []
    for (const tag of ['h1', 'h2', 'h3']) {
      doc.querySelectorAll(tag).forEach(el => {
        const text = el.textContent?.trim()
        if (text && text.length > 3 && text.length < 200) headings.push(text)
      })
    }

    // Extract meta description
    const metaDesc = doc.querySelector('meta[name="description"]')?.content || ''

    // Extract title
    const title = doc.querySelector('title')?.textContent || ''

    // Extract body text
    const bodyText = doc.body?.textContent || ''

    // Clean and tokenize
    const clean = bodyText
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()

    // Extract meaningful phrases (2-3 word combinations)
    const phrases = extractPhrases(clean)

    // Extract individual meaningful terms with frequency
    const words = clean.split(/\s+/).filter(w =>
      w.length > 4 &&
      !STOP_WORDS.has(w) &&
      !/^\d+$/.test(w) &&
      !/^(https?|www|com|html|class|href|data|onclick|div|span|src|alt|width|height|style|type|name|value|id|label|input|button|form|script)$/i.test(w)
    )

    // Count word frequency
    const freq = {}
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1
    }

    // Get top terms by frequency
    const terms = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word)

    return {
      terms,
      phrases: phrases.slice(0, 20),
      headings: headings.slice(0, 15),
      meta: `${title} ${metaDesc}`.trim(),
    }
  } catch {
    return { terms: [], phrases: [], headings: [], meta: '' }
  }
}

/**
 * Extract meaningful 2-3 word phrases from text using co-occurrence
 */
function extractPhrases(text) {
  const words = text.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
  const phraseCount = {}

  // 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i], w2 = words[i + 1]
    if (w1.length > 2 && w2.length > 2) {
      const phrase = `${w1} ${w2}`
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1
    }
  }

  // 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const w1 = words[i], w2 = words[i + 1], w3 = words[i + 2]
    if (w1.length > 2 && w2.length > 2 && w3.length > 2) {
      const phrase = `${w1} ${w2} ${w3}`
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1
    }
  }

  // Return phrases that appear 2+ times, sorted by frequency
  return Object.entries(phraseCount)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase)
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

  // Website source bonus (these are the most relevant)
  if (keywordObj.source === 'website-heading') score += 12
  else if (keywordObj.source === 'website-phrase') score += 10
  else if (keywordObj.source === 'website-meta') score += 8
  else if (keywordObj.source === 'website') score += 6

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
