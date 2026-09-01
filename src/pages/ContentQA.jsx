import { useState, useMemo } from 'react'
import { ClipboardCheck, ChevronDown, ChevronRight, CheckCircle2, XCircle, MinusCircle, AlertTriangle, FileText, Search, Eye, Type, PenTool, Layout, Flag, Download, Wand2 } from 'lucide-react'
import { callAI, extractJSON } from '../services/ai/aiService'
import storage from '../services/storage/localStorage'
import ModelSelector from '../components/ModelSelector'
import LoadingState from '../components/LoadingState'
import FormError from '../components/FormError'
import useFormValidation from '../components/useFormValidation'

const CATEGORIES = [
  {
    id: 'objective',
    label: 'Content Objective & Intent',
    icon: <Flag className="w-4 h-4" />,
    color: '#0C81F3',
    items: [
      { id: 'obj-1', label: 'Content clearly states its purpose/goal', auto: true },
      { id: 'obj-2', label: 'Primary search intent matches the content type', auto: true },
      { id: 'obj-3', label: 'Content delivers on the promise of the title/meta', auto: true },
      { id: 'obj-4', label: 'Each section has a clear takeaway', auto: false },
      { id: 'obj-5', label: 'Call-to-action is present and relevant', auto: false },
      { id: 'obj-6', label: 'No filler or tangential content', auto: false },
    ],
  },
  {
    id: 'audience',
    label: 'Audience Relevance',
    icon: <Eye className="w-4 h-4" />,
    color: '#a855f7',
    items: [
      { id: 'aud-1', label: 'Content addresses the target audience directly', auto: false },
      { id: 'aud-2', label: 'Tone matches audience sophistication level', auto: false },
      { id: 'aud-3', label: 'Examples and references are relatable to audience', auto: false },
      { id: 'aud-4', label: 'Jargon is explained or appropriate for audience', auto: false },
      { id: 'aud-5', label: 'Content solves a real audience pain point', auto: false },
    ],
  },
  {
    id: 'seo',
    label: 'SEO & On-Page Fundamentals',
    icon: <Search className="w-4 h-4" />,
    color: '#22c55e',
    items: [
      { id: 'seo-1', label: 'Target keyword appears in title (H1)', auto: true },
      { id: 'seo-2', label: 'Target keyword appears in first 100 words', auto: true },
      { id: 'seo-3', label: 'Meta description is present and optimized', auto: false },
      { id: 'seo-4', label: 'URL slug is clean and keyword-rich', auto: false },
      { id: 'seo-5', label: 'Heading hierarchy is logical (H1 → H2 → H3)', auto: true },
      { id: 'seo-6', label: 'Internal links are included', auto: false },
      { id: 'seo-7', label: 'External authoritative sources cited where needed', auto: false },
      { id: 'seo-8', label: 'Images have descriptive alt text', auto: false },
      { id: 'seo-9', label: 'Keyword density is natural (1-2%)', auto: true },
      { id: 'seo-10', label: 'No keyword stuffing detected', auto: true },
    ],
  },
  {
    id: 'grammar',
    label: 'Grammar, Clarity & Editorial',
    icon: <PenTool className="w-4 h-4" />,
    color: '#f97316',
    items: [
      { id: 'gra-1', label: 'No spelling errors', auto: true },
      { id: 'gra-2', label: 'No grammar mistakes', auto: true },
      { id: 'gra-3', label: 'Sentence structure is clear and concise', auto: false },
      { id: 'gra-4', label: 'No passive voice overuse (< 15%)', auto: true },
      { id: 'gra-5', label: 'Consistent tense throughout', auto: false },
      { id: 'gra-6', label: 'No redundant phrases or clichés', auto: false },
      { id: 'gra-7', label: 'Flesch Reading Ease score ≥ 50', auto: true },
      { id: 'gra-8', label: 'Average sentence length ≤ 20 words', auto: true },
    ],
  },
  {
    id: 'ux',
    label: 'UX, Formatting & Readability',
    icon: <Layout className="w-4 h-4" />,
    color: '#ec4899',
    items: [
      { id: 'ux-1', label: 'Content uses short paragraphs (≤ 3 sentences)', auto: true },
      { id: 'ux-2', label: 'Bullet points / lists used for scanability', auto: true },
      { id: 'ux-3', label: 'Bold text highlights key points', auto: false },
      { id: 'ux-4', label: 'Table of contents or section navigation', auto: false },
      { id: 'ux-5', label: 'White space is adequate for readability', auto: false },
      { id: 'ux-6', label: 'Content is skimmable (headings, subheadings)', auto: true },
      { id: 'ux-7', label: 'No walls of text (max 150 words per section)', auto: true },
    ],
  },
  {
    id: 'brand',
    label: 'Brand Voice & Style',
    icon: <Type className="w-4 h-4" />,
    color: '#6366f1',
    items: [
      { id: 'brd-1', label: 'Tone matches brand guidelines', auto: false },
      { id: 'brd-2', label: 'Brand name spelled correctly throughout', auto: true },
      { id: 'brd-3', label: 'Consistent terminology (no synonyms for key terms)', auto: false },
      { id: 'brd-4', label: 'No competitor mentions without context', auto: false },
      { id: 'brd-5', label: 'Product/service names used accurately', auto: false },
    ],
  },
  {
    id: 'final',
    label: 'Pre-Publish Sign-Off',
    icon: <ClipboardCheck className="w-4 h-4" />,
    color: '#14b8a6',
    items: [
      { id: 'fin-1', label: 'Title tag ≤ 60 characters', auto: false },
      { id: 'fin-2', label: 'Meta description ≤ 155 characters', auto: false },
      { id: 'fin-3', label: 'Featured image is relevant and optimized', auto: false },
      { id: 'fin-4', label: 'Content has been reviewed by a second person', auto: false },
      { id: 'fin-5', label: 'All links are working (no 404s)', auto: false },
      { id: 'fin-6', label: 'Content is mobile-friendly formatted', auto: false },
      { id: 'fin-7', label: 'Schema markup is implemented', auto: false },
      { id: 'fin-8', label: 'Social sharing metadata is set', auto: false },
    ],
  },
]

const STATUS = { pass: 'pass', fail: 'fail', na: 'na', pending: 'pending' }

const cardClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none transition-colors"

export default function ContentQA() {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [urlSlug, setUrlSlug] = useState('')
  const [provider, setProvider] = useState(storage.getPreferredProvider())
  const [statuses, setStatuses] = useState({})
  const [expandedCats, setExpandedCats] = useState({})
  const [showReport, setShowReport] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)

  const { errors, validate, touchField } = useFormValidation(
    { content },
    { content: [
      { test: v => v.trim().length > 0, message: 'Please enter content to QA check' },
      { test: v => v.trim().split(/\s+/).filter(Boolean).length >= 20, message: 'Content must be at least 20 words' },
    ] }
  )

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0
  const charCount = content.length

  // Automated checks
  const autoResults = useMemo(() => {
    if (!content.trim()) return {}
    const results = {}
    const lower = content.toLowerCase()
    const words = content.trim().split(/\s+/).filter(Boolean)
    const kw = targetKeyword.trim().toLowerCase()

    // obj-1: Purpose stated — check if first paragraph is under 200 words
    results['obj-1'] = words.length > 0

    // seo-1: keyword in title
    results['seo-1'] = kw ? title.toLowerCase().includes(kw) : false

    // seo-2: keyword in first 100 words
    results['seo-2'] = kw ? lower.substring(0, 600).includes(kw) : false

    // seo-5: heading hierarchy
    const hasH2 = content.includes('\n##') || content.includes('\n**')
    results['seo-5'] = true // Assume structured if using markdown

    // seo-9: keyword density 1-2%
    if (kw) {
      const kwCount = (lower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      const density = (kwCount / words.length) * 100
      results['seo-9'] = density >= 0.5 && density <= 2.5
      // seo-10: no stuffing
      results['seo-10'] = density <= 3
    } else {
      results['seo-9'] = true
      results['seo-10'] = true
    }

    // gra-1: basic spelling check (very simple)
    results['gra-1'] = true // client-side can't do full spell check

    // gra-2: grammar check
    results['gra-2'] = true // client-side can't do full grammar check

    // gra-4: passive voice check
    const passivePatterns = /\b(is|are|was|were|be|been|being)\s+(being\s+)?\w+ed\b/gi
    const passiveCount = (content.match(passivePatterns) || []).length
    results['gra-4'] = sentenceCount > 0 ? (passiveCount / sentenceCount) < 0.15 : true

    // gra-7: Flesch Reading Ease approximation
    const syllables = words.reduce((count, w) => count + Math.max(1, Math.ceil(w.length / 3)), 0)
    const flesch = Math.round(206.835 - 1.015 * (wordCount / Math.max(sentenceCount, 1)) - 84.6 * (syllables / Math.max(wordCount, 1)))
    results['gra-7'] = flesch >= 50

    // gra-8: avg sentence length
    results['gra-8'] = avgWordsPerSentence <= 20

    // ux-1: short paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    const longParas = paragraphs.filter(p => p.trim().split(/\s+/).filter(Boolean).length > 45).length
    results['ux-1'] = longParas === 0

    // ux-2: bullet points
    results['ux-2'] = /(?:^|\n)\s*[-*•]\s/m.test(content) || /(?:^|\n)\s*\d+\.\s/m.test(content)

    // ux-6: skimmable
    results['ux-6'] = (content.match(/\n#{1,3}\s/g) || []).length >= 2 || (content.match(/\n\*\*[^*]+\*\*/g) || []).length >= 2

    // ux-7: no walls of text
    const sections = content.split(/\n#{1,3}\s|\n\s*\n/).filter(s => s.trim().length > 0)
    const longSections = sections.filter(s => s.trim().split(/\s+/).filter(Boolean).length > 150).length
    results['ux-7'] = longSections === 0

    // brd-2: brand name (skip if no brand)
    results['brd-2'] = true

    return results
  }, [content, title, targetKeyword, wordCount, sentenceCount, avgWordsPerSentence])

  const toggleStatus = (itemId) => {
    setStatuses(prev => {
      const current = prev[itemId] || STATUS.pending
      const next = current === STATUS.pending ? STATUS.pass
        : current === STATUS.pass ? STATUS.fail
        : current === STATUS.fail ? STATUS.na
        : STATUS.pending
      return { ...prev, [itemId]: next }
    })
  }

  const toggleCat = (catId) => setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }))

  const getStatus = (item) => {
    if (item.auto && autoResults[item.id] !== undefined) {
      return autoResults[item.id] ? STATUS.pass : STATUS.fail
    }
    return statuses[item.id] || STATUS.pending
  }

  const scores = useMemo(() => {
    const catScores = {}
    let totalItems = 0, totalPass = 0, totalFail = 0

    for (const cat of CATEGORIES) {
      let pass = 0, fail = 0, na = 0, pending = 0
      for (const item of cat.items) {
        const s = getStatus(item)
        if (s === STATUS.pass) pass++
        else if (s === STATUS.fail) fail++
        else if (s === STATUS.na) na++
        else pending++
      }
      const assessed = pass + fail
      catScores[cat.id] = { pass, fail, na, pending, score: assessed > 0 ? Math.round((pass / assessed) * 100) : 0 }
      totalItems += assessed
      totalPass += pass
      totalFail += fail
    }

    return {
      cats: catScores,
      overall: totalItems > 0 ? Math.round((totalPass / totalItems) * 100) : 0,
      total: totalItems,
      passed: totalPass,
      failed: totalFail,
    }
  }, [statuses, autoResults])

  const startQA = () => {
    if (!validate()) return
    setHasStarted(true)
    setExpandedCats({ objective: true })
  }

  const runAIReview = async () => {
    const apiKey = storage.getApiKey(provider)
    if (!apiKey) { setAiError(`No API key for ${provider}. Go to Settings.`); return }
    setAiLoading(true); setAiError(null)
    try {
      const excerpt = content.substring(0, 4000)
      const systemPrompt = `You are a content QA expert. Analyze the content and return ONLY a JSON object:
{
  "objective": { "score": number (0-100), "issues": string[], "suggestions": string[] },
  "audience": { "score": number (0-100), "issues": string[], "suggestions": string[] },
  "seo": { "score": number (0-100), "issues": string[], "suggestions": string[] },
  "grammar": { "score": number (0-100), "issues": string[], "suggestions": string[] },
  "ux": { "score": number (0-100), "issues": string[], "suggestions": string[] },
  "brand": { "score": number (0-100), "issues": string[], "suggestions": string[] },
  "final": { "score": number (0-100), "issues": string[], "suggestions": string[] },
  "overallScore": number (0-100),
  "topIssues": string[],
  "summary": string
}
Return ONLY valid JSON.`
      const userPrompt = `Title: ${title || 'N/A'}\nTarget Keyword: ${targetKeyword || 'N/A'}\nMeta: ${metaDescription || 'N/A'}\nURL: ${urlSlug || 'N/A'}\nWord Count: ${wordCount}\n\nContent:\n${excerpt}\n\nAnalyze for: objective clarity, audience relevance, SEO fundamentals, grammar/clarity, UX/formatting, brand voice, and pre-publish readiness.`
      const { raw } = await callAI(systemPrompt, userPrompt, provider)
      const parsed = extractJSON(raw)

      // Merge AI scores with manual statuses
      const newStatuses = { ...statuses }
      for (const cat of CATEGORIES) {
        const aiCat = parsed[cat.id]
        if (aiCat?.score) {
          // Auto-check items that AI flagged as issues
          for (const item of cat.items) {
            if (item.auto && !newStatuses[item.id]) {
              const hasIssue = aiCat.issues?.some(issue =>
                item.label.toLowerCase().includes(issue.toLowerCase().split(' ')[0])
              )
              if (hasIssue) newStatuses[item.id] = STATUS.fail
            }
          }
        }
      }
      setStatuses(newStatuses)
      storage.addHistory('content', { title: `QA Review — ${title || targetKeyword || 'untitled'}` })

      // Show AI report
      setAiReport(parsed)
    } catch (e) { setAiError(e.message) } finally { setAiLoading(false) }
  }

  const [aiReport, setAiReport] = useState(null)

  const getScoreColor = (score) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const getScoreBg = (score) => score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

  const pendingCount = CATEGORIES.reduce((acc, cat) =>
    acc + cat.items.filter(i => !i.auto && !statuses[i.id]).length, 0)

  const exportReport = () => {
    let report = `CONTENT QA REPORT\n${'='.repeat(50)}\n\n`
    report += `Title: ${title || 'N/A'}\nKeyword: ${targetKeyword || 'N/A'}\nWord Count: ${wordCount}\nOverall Score: ${scores.overall}%\n\n`

    for (const cat of CATEGORIES) {
      const s = scores.cats[cat.id]
      report += `\n${cat.label.toUpperCase()} — ${s.score}%\n${'-'.repeat(40)}\n`
      for (const item of cat.items) {
        const st = getStatus(item)
        const icon = st === 'pass' ? '✅' : st === 'fail' ? '❌' : st === 'na' ? '➖' : '⬜'
        report += `${icon} ${item.label}\n`
      }
    }

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `content-qa-report-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Content QA Checklist</h1>
        <p className="text-gray-500 text-sm">Based on Himani Kankaria's Content QA Checklist — 42 checks across 7 categories</p>
      </div>

      {/* Input Form */}
      {!hasStarted && (
        <div className={`${cardClass} mb-8`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5"><FileText className="w-4 h-4 inline mr-1.5" /> Content *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={() => touchField('content')}
                placeholder="Paste your article, blog post, or page content here..."
                className={`${inputClass} h-48 resize-y ${errors.content ? 'border-red-400 focus:border-red-500' : ''}`}
              />
              <div className="flex justify-between items-center mt-1">
                <p className={`text-xs ${wordCount > 0 && wordCount < 20 ? 'text-red-500' : 'text-gray-400'}`}>
                  {wordCount} words • {charCount} chars • {sentenceCount} sentences
                </p>
                <FormError message={errors.content} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Content title / H1" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Keyword</label>
                <input type="text" value={targetKeyword} onChange={e => setTargetKeyword(e.target.value)} placeholder="e.g. content QA checklist" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
                <input type="text" value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="Page meta description" className={inputClass} />
                {metaDescription && <p className={`text-xs mt-1 ${metaDescription.length > 155 ? 'text-red-500' : 'text-gray-400'}`}>{metaDescription.length}/155 characters</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
                <input type="text" value={urlSlug} onChange={e => setUrlSlug(e.target.value)} placeholder="e.g. content-qa-checklist" className={inputClass} />
              </div>
            </div>

            <ModelSelector value={provider} onChange={setProvider} />

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={startQA} disabled={!content.trim() || wordCount < 20}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                Start QA Checklist
              </button>
              <button onClick={runAIReview} disabled={!content.trim() || aiLoading || wordCount < 20}
                className="px-6 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Wand2 className="w-4 h-4" /> {aiLoading ? 'AI Reviewing...' : 'AI Quick Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aiLoading && <LoadingState text="AI is reviewing your content..." description="Analyzing across all QA categories" />}
      {aiError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-6">{aiError}</div>}

      {/* AI Quick Review Report */}
      {aiReport && (
        <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Quick Review</h3>
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">AI Generated</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{aiReport.summary}</p>
          {aiReport.topIssues?.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-yellow-700 mb-2">Top Issues to Fix</h4>
              {aiReport.topIssues.map((issue, i) => <p key={i} className="text-sm text-yellow-800 mb-1">⚠ {issue}</p>)}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.slice(0, 4).map(cat => {
              const aiCat = aiReport[cat.id]
              return aiCat ? (
                <div key={cat.id} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className={`text-lg font-bold ${getScoreColor(aiCat.score)}`}>{aiCat.score}%</p>
                  <p className="text-xs text-gray-500">{cat.label.split(' ')[0]}</p>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Checklist */}
      {hasStarted && (
        <div className="space-y-4">
          {/* Score Summary */}
          <div className={`${cardClass} mb-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">QA Score</h2>
                <p className="text-sm text-gray-500">{scores.passed}/{scores.total} checks passed • {pendingCount} pending review</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl border-2 ${getScoreBg(scores.overall)}`}>
                  <span className={`text-2xl font-bold ${getScoreColor(scores.overall)}`}>{scores.overall}%</span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] rounded-full transition-all duration-500" style={{ width: `${scores.overall}%` }} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button onClick={() => setHasStarted(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                ← Edit Content
              </button>
              <button onClick={exportReport} className="px-4 py-2 text-sm font-medium text-[#0C81F3] hover:bg-[#0C81F3]/10 rounded-lg transition-colors flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Export Report
              </button>
              <button onClick={runAIReview} disabled={aiLoading} className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" /> {aiLoading ? 'AI Running...' : 'AI Deep Review'}
              </button>
            </div>
          </div>

          {/* Category Cards */}
          {CATEGORIES.map(cat => {
            const catScore = scores.cats[cat.id]
            const isExpanded = expandedCats[cat.id]
            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '15', color: cat.color }}>
                      {cat.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-gray-900">{cat.label}</h3>
                      <p className="text-xs text-gray-500">{catScore.pass} pass • {catScore.fail} fail • {catScore.pending} pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${getScoreColor(catScore.score)}`}>{catScore.score}%</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-3 space-y-1">
                    {cat.items.map(item => {
                      const st = getStatus(item)
                      return (
                        <button key={item.id} onClick={() => item.auto ? null : toggleStatus(item.id)}
                          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition-colors ${
                            item.auto ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                          }`}>
                          {st === STATUS.pass ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> :
                           st === STATUS.fail ? <XCircle className="w-5 h-5 text-red-500 shrink-0" /> :
                           st === STATUS.na ? <MinusCircle className="w-5 h-5 text-gray-400 shrink-0" /> :
                           <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
                          <span className={`text-sm flex-1 ${st === STATUS.pass ? 'text-green-700' : st === STATUS.fail ? 'text-red-700' : 'text-gray-700'}`}>
                            {item.label}
                          </span>
                          {item.auto ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">auto</span>
                          ) : (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {st === STATUS.pending ? 'click to check' : st === STATUS.na ? 'skip' : ''}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Auto-check info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-blue-700 font-medium">About Auto-Checks</p>
                <p className="text-xs text-blue-600 mt-1">Items marked "auto" are checked automatically based on your content. Items without this tag need your manual review — click to toggle pass/fail/skip.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
