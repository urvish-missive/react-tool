import { useState, useCallback } from 'react'
import { FileText, Target, Globe, Search, Wand2, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { analyzeContent } from '../services/seo/contentAnalyzer'
import { callAI, extractJSON } from '../services/ai/aiService'
import storage from '../services/storage/localStorage'
import ScoreCircle from '../components/ScoreCircle'
import ScoreCard from '../components/ScoreCard'
import ProgressBar from '../components/ProgressBar'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import ExportButton from '../components/ExportButton'
import ModelSelector from '../components/ModelSelector'

const CONTENT_TYPES = ['article', 'blog post', 'landing page', 'product page', 'service page', 'homepage']
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan']

const AI_SYSTEM_PROMPT = `You are an SEO expert. Analyze the provided content and return ONLY a JSON object with these fields:
{
  "overallScore": number (0-100),
  "contentQuality": number (0-100),
  "seoOptimization": number (0-100),
  "readability": number (0-100),
  "keywordOptimization": number (0-100),
  "strengths": string[],
  "issues": string[],
  "recommendations": string[],
  "suggestedTitle": string,
  "suggestedMetaDescription": string,
  "missingTopics": string[]
}
Return ONLY valid JSON. No markdown, no explanation.`

const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none transition-colors"
const selectClass = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-[#0C81F3] focus:outline-none appearance-none cursor-pointer"
const cardClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm"

export default function ContentAnalyzer() {
  const [form, setForm] = useState({
    content: '',
    keyword: '',
    secondaryKeywords: '',
    contentType: 'article',
    country: 'India',
  })
  const [provider, setProvider] = useState(storage.getPreferredProvider())
  const [result, setResult] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiError, setAiError] = useState(null)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const analyze = useCallback(() => {
    if (!form.content.trim()) { setError('Please enter some content to analyze'); return }
    setError(null); setAiError(null); setAiResult(null); setLoading(true)
    setTimeout(() => {
      try {
        const secondary = form.secondaryKeywords.split(',').map(s => s.trim()).filter(Boolean)
        const res = analyzeContent(form.content, { keyword: form.keyword, secondaryKeywords: secondary, contentType: form.contentType })
        setResult(res)
        storage.addHistory('content', { title: `Content Analysis — ${form.keyword || 'untitled'}`, score: res.score })
      } catch (e) { setError(e.message) } finally { setLoading(false) }
    }, 300)
  }, [form])

  const runAI = async () => {
    const apiKey = storage.getApiKey(provider)
    if (!apiKey) { setAiError(`No API key for ${provider}. Go to Settings.`); return }
    setAiLoading(true); setAiError(null)
    try {
      const contentExcerpt = form.content.substring(0, 4000)
      const userPrompt = `Analyze this SEO content:\n\nContent: ${contentExcerpt}\nTarget Keyword: ${form.keyword || 'N/A'}\nContent Type: ${form.contentType}\nCountry: ${form.country}\n\nReturn JSON with: overallScore, contentQuality, seoOptimization, readability, keywordOptimization, strengths[], issues[], recommendations[], suggestedTitle, suggestedMetaDescription, missingTopics[]`
      const { raw } = await callAI(AI_SYSTEM_PROMPT, userPrompt, provider)
      setAiResult(extractJSON(raw))
      storage.addHistory('content', { title: `AI Analysis — ${form.keyword || 'untitled'}` })
    } catch (e) { setAiError(e.message) } finally { setAiLoading(false) }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Analyzer</h1>
        <p className="text-gray-500 text-sm">Analyze your content for SEO optimization, readability, and keyword usage</p>
      </div>

      <div className={`${cardClass} mb-8`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1.5" /> Content *
            </label>
            <textarea
              value={form.content} onChange={e => update('content', e.target.value)}
              placeholder="Paste your article, blog post, or page content here..."
              className={`${inputClass} h-48 resize-y`}
            />
            <p className="text-xs text-gray-400 mt-1">{form.content.split(/\s+/).filter(Boolean).length} words • {form.content.length} characters</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5"><Target className="w-4 h-4 inline mr-1.5" /> Primary Keyword</label>
              <input type="text" value={form.keyword} onChange={e => update('keyword', e.target.value)} placeholder="e.g. insurance" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Secondary Keywords</label>
              <input type="text" value={form.secondaryKeywords} onChange={e => update('secondaryKeywords', e.target.value)} placeholder="comma separated" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content Type</label>
                <select value={form.contentType} onChange={e => update('contentType', e.target.value)} className={selectClass}>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5"><Globe className="w-3.5 h-3.5 inline mr-1" /> Country</label>
                <select value={form.country} onChange={e => update('country', e.target.value)} className={selectClass}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <ModelSelector value={provider} onChange={setProvider} />
            <div className="flex gap-3">
              <button onClick={analyze} disabled={!form.content.trim() || loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Analyzing...' : 'Analyze Content'}
              </button>
              <button onClick={runAI} disabled={!form.content.trim() || aiLoading}
                className="px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> {aiLoading ? 'AI Running...' : 'AI Analysis'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorState title="Analysis Error" message={error} onRetry={() => { setError(null); analyze() }} />}
      {aiError && <ErrorState title="AI Error" message={aiError} />}
      {loading && <LoadingState text="Analyzing content..." description="Running client-side SEO checks" />}
      {aiLoading && <LoadingState text="Running AI analysis..." description="Connecting to AI provider" />}

      {result && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className={`${cardClass}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
              <ExportButton data={result} filename="content-analysis" label="Export" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <ScoreCircle score={result.score} size={100} label="Overall" />
              <ScoreCard label="Words" value={result.metrics.wordCount} icon="📝" small />
              <ScoreCard label="Sentences" value={result.metrics.sentenceCount} icon="📖" small />
              <ScoreCard label="Paragraphs" value={result.metrics.paragraphCount} icon="📄" small />
              <ScoreCard label="Reading Time" value={`${result.metrics.readingTime} min`} icon="⏱️" small />
              <ScoreCard label="Avg Words/Sentence" value={result.metrics.avgWordsPerSentence} icon="📊" small />
            </div>
          </div>

          <div className={`${cardClass}`}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Readability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <ProgressBar value={result.readability.fleschReadingEase} label="Flesch Reading Ease" />
                <p className="text-xs text-gray-400 mt-1">{result.readability.readingLevel} — Grade {result.readability.grade}</p>
              </div>
              <ScoreCard label="Avg Sentence Length" value={`${result.readability.avgSentenceLength} words`} small />
              <ScoreCard label="Complex Words" value={`${result.readability.complexWordPercentage}%`} small />
            </div>
          </div>

          {form.keyword && result.keyword && (
            <div className={`${cardClass}`}>
              <h3 className="text-base font-semibold text-gray-900 mb-4"><Target className="w-4 h-4 inline mr-1.5" /> Keyword: {result.keyword.keyword}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ScoreCard label="Occurrences" value={result.keyword.count} icon="🔢" small />
                <ScoreCard label="Density" value={`${result.keyword.density}%`} icon="📊" small />
                <ScoreCard label="In First Paragraph" value={result.keyword.inFirstParagraph ? 'Yes ✓' : 'No ✗'} small />
                <ScoreCard label="In Title" value={result.keyword.inTitle ? 'Yes ✓' : 'No ✗'} small />
              </div>
            </div>
          )}

          <div className={`${cardClass}`}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Heading Structure</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(result.metrics.headingCounts).map(([tag, count]) => (
                <ScoreCard key={tag} label={tag.toUpperCase()} value={count} small />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardClass}`}>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Issues Found</h3>
              {result.issues.length === 0 ? (
                <p className="text-sm text-gray-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> No issues found</p>
              ) : (
                <div className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {issue.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> :
                       issue.type === 'warning' ? <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" /> :
                       <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                      <span className="text-gray-700">{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`${cardClass}`}>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Suggestions</h3>
              {result.suggestions.length === 0 ? (
                <p className="text-sm text-gray-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Content looks good!</p>
              ) : (
                <div className="space-y-2">
                  {result.suggestions.map((sug, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#0C81F3] mt-0.5">•</span>
                      <span className="text-gray-700">{sug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {aiResult && !aiLoading && (
        <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm mt-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Analysis</h3>
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">AI Generated</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Overall', value: aiResult.overallScore },
              { label: 'Quality', value: aiResult.contentQuality },
              { label: 'SEO', value: aiResult.seoOptimization },
              { label: 'Readability', value: aiResult.readability },
              { label: 'Keywords', value: aiResult.keywordOptimization },
            ].map(s => (
              <ScoreCard key={s.label} label={s.label} value={s.value ? `${s.value}/100` : 'N/A'} small />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {aiResult.strengths?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                {aiResult.strengths.map((s, i) => <p key={i} className="text-sm text-gray-700 mb-1">✓ {s}</p>)}
              </div>
            )}
            {aiResult.issues?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-600 mb-2">Issues</h4>
                {aiResult.issues.map((s, i) => <p key={i} className="text-sm text-gray-700 mb-1">⚠ {s}</p>)}
              </div>
            )}
          </div>
          {aiResult.recommendations?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-[#0C81F3] mb-2">Recommendations</h4>
              {aiResult.recommendations.map((r, i) => <p key={i} className="text-sm text-gray-700 mb-1">→ {r}</p>)}
            </div>
          )}
          {(aiResult.suggestedTitle || aiResult.suggestedMetaDescription) && (
            <div className="bg-gray-50 rounded-lg p-4">
              {aiResult.suggestedTitle && <p className="text-sm text-gray-700 mb-2"><strong>Suggested Title:</strong> {aiResult.suggestedTitle}</p>}
              {aiResult.suggestedMetaDescription && <p className="text-sm text-gray-700"><strong>Suggested Meta:</strong> {aiResult.suggestedMetaDescription}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
