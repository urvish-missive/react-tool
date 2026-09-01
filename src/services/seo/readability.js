/**
 * Client-side readability analysis
 */

export function analyzeReadability(text) {
  if (!text || !text.trim()) {
    return {
      fleschReadingEase: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      complexWordPercentage: 0,
      readingLevel: 'Unknown',
      grade: 0,
    }
  }

  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = clean.split(/\s+/).filter(w => w.length > 0)
  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0)

  const totalWords = words.length || 1
  const totalSentences = sentences.length || 1

  const avgSentenceLength = totalWords / totalSentences
  const avgSyllablesPerWord = syllables / totalWords

  // Flesch Reading Ease
  const fleschReadingEase = Math.max(0, Math.min(100,
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord
  ))

  // Complex words (3+ syllables)
  const complexWords = words.filter(w => countSyllables(w) >= 3).length
  const complexWordPercentage = (complexWords / totalWords) * 100

  // Grade level (Flesch-Kincaid)
  const grade = Math.round(
    0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59
  )

  let readingLevel = 'Standard'
  if (fleschReadingEase >= 90) readingLevel = 'Very Easy'
  else if (fleschReadingEase >= 80) readingLevel = 'Easy'
  else if (fleschReadingEase >= 70) readingLevel = 'Fairly Easy'
  else if (fleschReadingEase >= 60) readingLevel = 'Standard'
  else if (fleschReadingEase >= 50) readingLevel = 'Fairly Difficult'
  else if (fleschReadingEase >= 30) readingLevel = 'Difficult'
  else readingLevel = 'Very Difficult'

  return {
    fleschReadingEase: Math.round(fleschReadingEase),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round((words.reduce((s, w) => s + w.length, 0) / totalWords) * 10) / 10,
    complexWordPercentage: Math.round(complexWordPercentage),
    readingLevel,
    grade: Math.max(0, grade),
    totalWords,
    totalSentences,
    totalSyllables: syllables,
  }
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  
  const vowels = word.match(/[aeiouy]{1,2}/g)
  return vowels ? Math.max(vowels.length, 1) : 1
}

export function getReadabilityScore(fleschScore) {
  // Normalize to 0-100 (higher is better = easier to read)
  return Math.round(fleschScore)
}
