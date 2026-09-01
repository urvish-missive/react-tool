import { analyzeReadability } from './readability'
import { calculateKeywordDensity, countOccurrences } from './scoring'

/**
 * Client-side SEO content analysis
 */
export function analyzeContent(content, options = {}) {
  const { keyword = '', secondaryKeywords = [], contentType = 'article' } = options
  if (!content || !content.trim()) return null

  const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const isHTML = /<[a-z][\s\S]*>/i.test(content)

  // Basic metrics
  const words = clean.split(/\s+/).filter(Boolean)
  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  const wordCount = words.length
  const charCount = clean.length
  const sentenceCount = sentences.length
  const paragraphCount = paragraphs.length
  const avgWordsPerSentence = sentenceCount ? Math.round(wordCount / sentenceCount) : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Heading analysis (HTML or plain text)
  const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 }
  const headings = []

  if (isHTML) {
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)</h${i}>`, 'gi')
      const matches = content.matchAll(regex)
      for (const match of matches) {
        const text = match[1].replace(/<[^>]+>/g, '').trim()
        if (text) {
          headingCounts[`h${i}`]++
          headings.push({ level: i, text })
        }
      }
    }
  } else {
    const lines = content.split('\n')
    for (const line of lines) {
      const h = line.match(/^#{1,6}\s+(.+)/)
      if (h) {
        const level = line.match(/^(#+)/)[1].length
        headingCounts[`h${level}`]++
        headings.push({ level, text: h[1].trim() })
      }
    }
  }

  // Link analysis (HTML only)
  let linkCount = 0
  let internalLinks = 0
  let externalLinks = 0
  if (isHTML) {
    const links = content.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)
    for (const link of links) {
      linkCount++
      if (link[1].startsWith('http')) externalLinks++
      else internalLinks++
    }
  }

  // Image analysis (HTML only)
  let imageCount = 0
  let imagesWithAlt = 0
  if (isHTML) {
    const images = content.matchAll(/<img\s+[^>]*>/gi)
    for (const img of images) {
      imageCount++
      if (/alt=["'][^"']+["']/.test(img[0])) imagesWithAlt++
    }
  }

  // Keyword analysis
  const keywordData = analyzeKeyword(content, keyword)
  const secondaryKeywordData = secondaryKeywords.map(kw => ({
    keyword: kw,
    ...analyzeKeyword(content, kw),
  }))

  // Readability
  const readability = analyzeReadability(content)

  // Content structure issues
  const issues = []
  if (headingCounts.h1 === 0) issues.push({ type: 'error', message: 'Missing H1 tag', category: 'Structure' })
  if (headingCounts.h1 > 1) issues.push({ type: 'warning', message: 'Multiple H1 tags found', category: 'Structure' })
  if (wordCount < 300) issues.push({ type: 'warning', message: 'Content is very short (under 300 words)', category: 'Content' })
  if (wordCount > 5000) issues.push({ type: 'info', message: 'Long-form content — consider breaking into sections', category: 'Content' })
  if (keyword && keywordData.density > 3) issues.push({ type: 'error', message: `Keyword stuffing detected (${keywordData.density}% density)`, category: 'Keywords' })
  if (keyword && keywordData.density > 0 && keywordData.density < 0.5) issues.push({ type: 'warning', message: `Keyword density too low (${keywordData.density}%)`, category: 'Keywords' })
  if (readability.fleschReadingEase < 30) issues.push({ type: 'warning', message: 'Content is very difficult to read', category: 'Readability' })
  if (avgWordsPerSentence > 25) issues.push({ type: 'warning', message: 'Average sentence length is high', category: 'Readability' })
  if (readability.complexWordPercentage > 25) issues.push({ type: 'info', message: 'High percentage of complex words', category: 'Readability' })
  if (paragraphCount < 3) issues.push({ type: 'info', message: 'Consider adding more paragraphs', category: 'Structure' })

  // Suggestions
  const suggestions = []
  if (!keyword) suggestions.push('Add a target keyword for better optimization')
  if (keyword && !keywordData.inFirstParagraph) suggestions.push('Include keyword in the first paragraph')
  if (keyword && !keywordData.inTitle) suggestions.push('Include keyword in the title/first line')
  if (headingCounts.h2 === 0) suggestions.push('Add H2 subheadings to structure your content')
  if (readability.fleschReadingEase < 60) suggestions.push('Simplify language — aim for shorter sentences and common words')
  if (wordCount < 600) suggestions.push('Expand content to 600+ words for better SEO')
  if (isHTML && imageCount === 0) suggestions.push('Add images with descriptive alt text')
  if (isHTML && imagesWithAlt < imageCount) suggestions.push('Add alt text to all images')

  // Score
  let totalScore = 50
  if (keywordData.inTitle) totalScore += 10
  if (keywordData.inH1) totalScore += 5
  if (keywordData.inFirstParagraph) totalScore += 5
  if (keywordData.density >= 0.5 && keywordData.density <= 2.5) totalScore += 10
  if (headingCounts.h1 === 1) totalScore += 5
  if (headingCounts.h2 >= 2) totalScore += 5
  if (readability.fleschReadingEase >= 60) totalScore += 10
  totalScore = Math.min(100, Math.max(0, totalScore))

  return {
    metrics: {
      wordCount,
      charCount,
      sentenceCount,
      paragraphCount,
      avgWordsPerSentence,
      readingTime,
      headingCounts,
      headings,
      linkCount,
      internalLinks,
      externalLinks,
      imageCount,
      imagesWithAlt,
    },
    keyword: keywordData,
    secondaryKeywords: secondaryKeywordData,
    readability,
    issues,
    suggestions,
    score: totalScore,
  }
}

function analyzeKeyword(text, keyword) {
  if (!keyword) {
    return {
      keyword: '',
      count: 0,
      density: 0,
      inTitle: false,
      inH1: false,
      inH2: false,
      inFirstParagraph: false,
      firstOccurrencePosition: -1,
    }
  }

  const clean = text.replace(/<[^>]+>/g, ' ')
  const lowerClean = clean.toLowerCase()
  const kw = keyword.toLowerCase()
  const count = (lowerClean.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
  const wordCount = lowerClean.split(/\s+/).filter(Boolean).length || 1

  const firstParagraph = (text.split(/\n\s*\n/)[0] || '').toLowerCase()

  return {
    keyword,
    count,
    density: Math.round((count / wordCount) * 100 * 100) / 100,
    inTitle: lowerClean.startsWith(kw) || lowerClean.includes(kw),
    inH1: false,
    inH2: false,
    inFirstParagraph: firstParagraph.includes(kw),
    firstOccurrencePosition: lowerClean.indexOf(kw),
  }
}
