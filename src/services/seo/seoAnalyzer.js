/**
 * Client-side HTML SEO analyzer
 */
export function analyzeSEO(html, keyword = '') {
  if (!html || !html.trim()) return null

  const checks = []
  const parsed = parseHTML(html)

  // Title checks
  checks.push(checkTitle(parsed, keyword))
  checks.push(checkTitleLength(parsed))

  // Meta description
  checks.push(checkMetaDescription(parsed, keyword))
  checks.push(checkMetaDescriptionLength(parsed))

  // Headings
  checks.push(checkHeadingStructure(parsed))
  checks.push(checkHeadingHierarchy(parsed))
  if (keyword) checks.push(checkKeywordInHeadings(parsed, keyword))

  // Images
  checks.push(checkImages(parsed))

  // Links
  checks.push(checkLinks(parsed))

  // Technical SEO
  checks.push(checkViewport(parsed))
  checks.push(checkCharset(parsed))
  checks.push(checkLanguage(parsed))
  checks.push(checkCanonical(parsed))
  checks.push(checkRobots(parsed))

  // Social / Structured data
  checks.push(checkOpenGraph(parsed))
  checks.push(checkTwitterCard(parsed))
  checks.push(checkSchemaOrg(parsed))

  // Content
  checks.push(checkContentLength(parsed))
  checks.push(checkHTMLSize(html))
  if (keyword) checks.push(checkKeywordInContent(parsed, keyword))

  // Calculate scores by category
  const categories = {
    technical: { total: 0, passed: 0, warnings: 0, failed: 0 },
    onpage: { total: 0, passed: 0, warnings: 0, failed: 0 },
    content: { total: 0, passed: 0, warnings: 0, failed: 0 },
    images: { total: 0, passed: 0, warnings: 0, failed: 0 },
    links: { total: 0, passed: 0, warnings: 0, failed: 0 },
    structured: { total: 0, passed: 0, warnings: 0, failed: 0 },
    social: { total: 0, passed: 0, warnings: 0, failed: 0 },
  }

  for (const check of checks) {
    const cat = categories[check.category] || categories.technical
    cat.total++
    if (check.status === 'pass') cat.passed++
    else if (check.status === 'warning') cat.warnings++
    else cat.failed++
  }

  const scores = {}
  for (const [key, cat] of Object.entries(categories)) {
    scores[key] = cat.total ? Math.round(((cat.passed + cat.warnings * 0.5) / cat.total) * 100) : 0
  }

  const totalChecks = checks.length
  const passedChecks = checks.filter(c => c.status === 'pass').length
  const warningChecks = checks.filter(c => c.status === 'warning').length
  const failedChecks = checks.filter(c => c.status === 'fail').length

  const overallScore = totalChecks
    ? Math.round(((passedChecks + warningChecks * 0.5) / totalChecks) * 100)
    : 0

  return {
    parsed,
    checks,
    categories: scores,
    summary: {
      totalChecks,
      passedChecks,
      warningChecks,
      failedChecks,
      overallScore,
    },
  }
}

function parseHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const title = doc.querySelector('title')?.textContent?.trim() || ''
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
  const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || ''
  const charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || ''
  const lang = doc.documentElement.getAttribute('lang') || ''

  const h1s = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent.trim())
  const h2s = Array.from(doc.querySelectorAll('h2')).map(el => el.textContent.trim())
  const h3s = Array.from(doc.querySelectorAll('h3')).map(el => el.textContent.trim())

  const images = Array.from(doc.querySelectorAll('img')).map(img => ({
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
    hasAlt: img.hasAttribute('alt'),
  }))

  const links = Array.from(doc.querySelectorAll('a[href]')).map(a => ({
    href: a.getAttribute('href'),
    text: a.textContent.trim().substring(0, 100),
    rel: a.getAttribute('rel') || '',
    nofollow: (a.getAttribute('rel') || '').includes('nofollow'),
    external: /^https?:\/\//.test(a.getAttribute('href')),
  }))

  const ogTags = {}
  doc.querySelectorAll('meta[property^="og:"]').forEach(m => {
    ogTags[m.getAttribute('property')] = m.getAttribute('content')
  })

  const twitterTags = {}
  doc.querySelectorAll('meta[name^="twitter:"]').forEach(m => {
    twitterTags[m.getAttribute('name')] = m.getAttribute('content')
  })

  const jsonLd = Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).map(s => {
    try { return JSON.parse(s.textContent) } catch { return null }
  }).filter(Boolean)

  const bodyText = doc.body?.textContent || ''

  return { title, metaDesc, canonical, robots, viewport, charset, lang, h1s, h2s, h3s, images, links, ogTags, twitterTags, jsonLd, bodyText }
}

// ─── Individual Checks ────────────────────────────────────

function checkTitle(p) {
  if (!p.title) return { name: 'Title Tag', status: 'fail', message: 'No title tag found', category: 'technical', weight: 10 }
  return { name: 'Title Tag', status: 'pass', message: `Title: "${p.title}"`, category: 'technical', weight: 10 }
}

function checkTitleLength(p) {
  if (!p.title) return { name: 'Title Length', status: 'fail', message: 'No title to check length', category: 'technical', weight: 5 }
  const len = p.title.length
  if (len < 30) return { name: 'Title Length', status: 'warning', message: `Title is short (${len} chars) — aim for 50-60`, category: 'technical', weight: 5 }
  if (len > 60) return { name: 'Title Length', status: 'warning', message: `Title is long (${len} chars) — may be truncated in search results`, category: 'technical', weight: 5 }
  return { name: 'Title Length', status: 'pass', message: `Title length is optimal (${len} chars)`, category: 'technical', weight: 5 }
}

function checkMetaDescription(p, keyword) {
  if (!p.metaDesc) return { name: 'Meta Description', status: 'fail', message: 'No meta description found', category: 'onpage', weight: 10 }
  if (keyword && !p.metaDesc.toLowerCase().includes(keyword.toLowerCase())) {
    return { name: 'Meta Description', status: 'warning', message: 'Meta description does not contain target keyword', category: 'onpage', weight: 10 }
  }
  return { name: 'Meta Description', status: 'pass', message: 'Meta description is present', category: 'onpage', weight: 10 }
}

function checkMetaDescriptionLength(p) {
  if (!p.metaDesc) return { name: 'Description Length', status: 'fail', message: 'No description to check', category: 'onpage', weight: 5 }
  const len = p.metaDesc.length
  if (len < 120) return { name: 'Description Length', status: 'warning', message: `Description is short (${len} chars) — aim for 150-160`, category: 'onpage', weight: 5 }
  if (len > 160) return { name: 'Description Length', status: 'warning', message: `Description is long (${len} chars) — may be truncated`, category: 'onpage', weight: 5 }
  return { name: 'Description Length', status: 'pass', message: `Description length is optimal (${len} chars)`, category: 'onpage', weight: 5 }
}

function checkHeadingStructure(p) {
  if (p.h1s.length === 0) return { name: 'H1 Tag', status: 'fail', message: 'No H1 tag found', category: 'content', weight: 10 }
  if (p.h1s.length > 1) return { name: 'H1 Tag', status: 'warning', message: `Multiple H1 tags (${p.h1s.length}) — use only one`, category: 'content', weight: 10 }
  return { name: 'H1 Tag', status: 'pass', message: `H1: "${p.h1s[0]}"`, category: 'content', weight: 10 }
}

function checkHeadingHierarchy(p) {
  const total = p.h1s.length + p.h2s.length + p.h3s.length
  if (total === 0) return { name: 'Heading Hierarchy', status: 'fail', message: 'No headings found', category: 'content', weight: 5 }
  if (p.h1s.length > 0 && p.h2s.length === 0 && p.h3s.length > 0) {
    return { name: 'Heading Hierarchy', status: 'warning', message: 'H3 without H2 — heading hierarchy issue', category: 'content', weight: 5 }
  }
  return { name: 'Heading Hierarchy', status: 'pass', message: `Found ${p.h1s.length} H1, ${p.h2s.length} H2, ${p.h3s.length} H3`, category: 'content', weight: 5 }
}

function checkKeywordInHeadings(p, keyword) {
  const kw = keyword.toLowerCase()
  const allHeadings = [...p.h1s, ...p.h2s, ...p.h3s].join(' ').toLowerCase()
  if (!allHeadings.includes(kw)) {
    return { name: 'Keyword in Headings', status: 'warning', message: `Keyword "${keyword}" not found in headings`, category: 'content', weight: 5 }
  }
  return { name: 'Keyword in Headings', status: 'pass', message: `Keyword found in headings`, category: 'content', weight: 5 }
}

function checkImages(p) {
  if (p.images.length === 0) {
    return { name: 'Image Alt Tags', status: 'warning', message: 'No images found on page', category: 'images', weight: 10 }
  }
  const missing = p.images.filter(img => !img.hasAlt)
  if (missing.length > 0) {
    return { name: 'Image Alt Tags', status: 'fail', message: `${missing.length}/${p.images.length} images missing alt attribute`, category: 'images', weight: 10 }
  }
  return { name: 'Image Alt Tags', status: 'pass', message: `All ${p.images.length} images have alt text`, category: 'images', weight: 10 }
}

function checkLinks(p) {
  if (p.links.length === 0) {
    return { name: 'Links', status: 'warning', message: 'No links found on page', category: 'links', weight: 5 }
  }
  const external = p.links.filter(l => l.external).length
  const nofollow = p.links.filter(l => l.nofollow).length
  return {
    name: 'Links',
    status: 'pass',
    message: `${p.links.length} links (${external} external, ${nofollow} nofollow)`,
    category: 'links',
    weight: 5,
  }
}

function checkViewport(p) {
  if (!p.viewport) return { name: 'Viewport', status: 'fail', message: 'No viewport meta tag', category: 'technical', weight: 5 }
  return { name: 'Viewport', status: 'pass', message: 'Viewport meta tag present', category: 'technical', weight: 5 }
}

function checkCharset(p) {
  if (!p.charset) return { name: 'Charset', status: 'fail', message: 'No charset declared', category: 'technical', weight: 3 }
  return { name: 'Charset', status: 'pass', message: `Charset: ${p.charset}`, category: 'technical', weight: 3 }
}

function checkLanguage(p) {
  if (!p.lang) return { name: 'Language', status: 'warning', message: 'No lang attribute on <html>', category: 'technical', weight: 3 }
  return { name: 'Language', status: 'pass', message: `Language: ${p.lang}`, category: 'technical', weight: 3 }
}

function checkCanonical(p) {
  if (!p.canonical) return { name: 'Canonical', status: 'warning', message: 'No canonical tag found', category: 'technical', weight: 5 }
  return { name: 'Canonical', status: 'pass', message: `Canonical: ${p.canonical}`, category: 'technical', weight: 5 }
}

function checkRobots(p) {
  if (!p.robots) return { name: 'Robots Meta', status: 'info', message: 'No robots meta tag (defaults to index,follow)', category: 'technical', weight: 3 }
  return { name: 'Robots Meta', status: 'pass', message: `Robots: ${p.robots}`, category: 'technical', weight: 3 }
}

function checkOpenGraph(p) {
  const required = ['og:title', 'og:description', 'og:image']
  const missing = required.filter(tag => !p.ogTags[tag])
  if (missing.length === required.length) {
    return { name: 'Open Graph', status: 'fail', message: 'No Open Graph tags found', category: 'social', weight: 5 }
  }
  if (missing.length > 0) {
    return { name: 'Open Graph', status: 'warning', message: `Missing OG tags: ${missing.join(', ')}`, category: 'social', weight: 5 }
  }
  return { name: 'Open Graph', status: 'pass', message: 'Open Graph tags complete', category: 'social', weight: 5 }
}

function checkTwitterCard(p) {
  const required = ['twitter:card', 'twitter:title', 'twitter:description']
  const missing = required.filter(tag => !p.twitterTags[tag])
  if (missing.length === required.length) {
    return { name: 'Twitter Card', status: 'warning', message: 'No Twitter Card tags found', category: 'social', weight: 3 }
  }
  if (missing.length > 0) {
    return { name: 'Twitter Card', status: 'warning', message: `Missing Twitter tags: ${missing.join(', ')}`, category: 'social', weight: 3 }
  }
  return { name: 'Twitter Card', status: 'pass', message: 'Twitter Card tags complete', category: 'social', weight: 3 }
}

function checkSchemaOrg(p) {
  if (p.jsonLd.length === 0) {
    return { name: 'Schema.org', status: 'warning', message: 'No JSON-LD structured data found', category: 'structured', weight: 5 }
  }
  const types = p.jsonLd.map(s => s['@type']).filter(Boolean).join(', ')
  return { name: 'Schema.org', status: 'pass', message: `JSON-LD found: ${types}`, category: 'structured', weight: 5 }
}

function checkContentLength(p) {
  const text = p.bodyText.replace(/\s+/g, ' ').trim()
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount < 200) return { name: 'Content Length', status: 'fail', message: `Very thin content (${wordCount} words)`, category: 'content', weight: 5 }
  if (wordCount < 500) return { name: 'Content Length', status: 'warning', message: `Low word count (${wordCount} words)`, category: 'content', weight: 5 }
  return { name: 'Content Length', status: 'pass', message: `Content length: ${wordCount} words`, category: 'content', weight: 5 }
}

function checkHTMLSize(html) {
  const kb = Math.round(html.length / 1024)
  if (kb > 500) return { name: 'HTML Size', status: 'warning', message: `Large HTML size (${kb} KB)`, category: 'technical', weight: 2 }
  return { name: 'HTML Size', status: 'pass', message: `HTML size: ${kb} KB`, category: 'technical', weight: 2 }
}

function checkKeywordInContent(p, keyword) {
  const text = p.bodyText.toLowerCase()
  const kw = keyword.toLowerCase()
  if (!text.includes(kw)) {
    return { name: 'Keyword in Content', status: 'fail', message: `Keyword "${keyword}" not found in page content`, category: 'content', weight: 5 }
  }
  return { name: 'Keyword in Content', status: 'pass', message: `Keyword "${keyword}" found in content`, category: 'content', weight: 5 }
}
