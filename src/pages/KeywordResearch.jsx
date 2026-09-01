import { useState, useCallback } from 'react'
import { Search, Wand2, Copy, Check, Globe, Briefcase, ArrowUpDown, Filter } from 'lucide-react'
import { generateKeywords, generateQuestionKeywords } from '../services/seo/keywordAnalyzer'
import { callAI, extractJSON } from '../services/ai/aiService'
import storage from '../services/storage/localStorage'
import ScoreCard from '../components/ScoreCard'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import ExportButton from '../components/ExportButton'
import ModelSelector from '../components/ModelSelector'
import FormError from '../components/FormError'
import useFormValidation from '../components/useFormValidation'
import { formatKeywordIntent } from '../utils/keywordUtils'

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan']
const BUSINESS_TYPES = ['ecommerce', 'saas', 'local', 'agency', 'blog', 'healthcare', 'finance', 'other']

const AI_SYSTEM_PROMPT = `You are an SEO keyword research expert. Generate keyword ideas based on the provided information and return ONLY JSON:
{
  "keywords": [
    { "keyword": string, "intent": "Informational|Commercial|Transactional|Comparison", "relevance": number (0-100), "reason": string }
  ]
}
Generate 15-25 diverse keywords covering different intents. Include long-tail, question, commercial, and informational keywords.
Return ONLY valid JSON. No markdown.`

const URL_REGEX = /^https?:\/\/.+\..+/

const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none transition-colors"
const selectClass = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-[#0C81F3] focus:outline-none appearance-none cursor-pointer"
const cardClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm"

export default function KeywordResearch() {
  const [form, setForm] = useState({ seedKeyword: '', websiteUrl: '', country: 'India', businessType: 'ecommerce' })
  const [provider, setProvider] = useState(storage.getPreferredProvider())
  const [keywords, setKeywords] = useState([])
  const [questions, setQuestions] = useState([])
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiError, setAiError] = useState(null)
  const [sortBy, setSortBy] = useState('opportunity')
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('keywords')
  const [siteInfo, setSiteInfo] = useState(null)

  const { errors, validate, touchField } = useFormValidation(form, {
    seedKeyword: [
      { test: (v, form) => v.trim().length > 0 || (form.websiteUrl || '').trim().length > 0, message: 'Enter a seed keyword or provide a website URL' },
    ],
    websiteUrl: [
      { test: (v) => v.trim().length === 0 || URL_REGEX.test(v.trim()), message: 'Enter a valid URL starting with http:// or https://' },
    ],
  })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const research = useCallback(async () => {
    const hasKeyword = form.seedKeyword?.trim()
    const hasUrl = form.websiteUrl?.trim()
    if (!hasKeyword && !hasUrl) { setError('Please enter a seed keyword or website URL'); return }
    if (hasUrl && !URL_REGEX.test(hasUrl)) { setError('Please enter a valid URL starting with http:// or https://'); return }
    setLoading(true); setError(null); setAiError(null); setSiteInfo(null)
    try {
      let websiteContent = '', seed = hasKeyword?.trim(), siteTitle = '', siteHeadings = []
      if (hasUrl) {
        const proxyUrls = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(form.websiteUrl)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(form.websiteUrl)}`,
        ]
        for (const proxyUrl of proxyUrls) {
          try {
            const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
            if (resp.ok) {
              const text = await resp.text()
              if (text.includes('<html') || text.includes('<head') || text.includes('<body')) {
                websiteContent = text
                const doc = new DOMParser().parseFromString(websiteContent, 'text/html')
                siteTitle = doc.querySelector('title')?.textContent || ''
                siteHeadings = Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean).slice(0, 8)
                break
              }
            }
          } catch { continue }
        }
        if (!seed && websiteContent) {
          const doc = new DOMParser().parseFromString(websiteContent, 'text/html')
          const topic = doc.querySelector('h1')?.textContent || doc.querySelector('title')?.textContent || ''
          seed = topic.replace(/[^\w\s]/g, '').trim()
        }
        setSiteInfo({ title: siteTitle, headings: siteHeadings, fetched: !!websiteContent })
      }
      if (!seed) { setError('Could not extract a topic. Please enter a seed keyword.'); setLoading(false); return }
      const results = generateKeywords(seed, { country: form.country, businessType: form.businessType, websiteContent })
      setKeywords(results.slice(0, 40))
      setQuestions(generateQuestionKeywords(seed))
      storage.addHistory('keyword', { seedKeyword: seed, url: form.websiteUrl || undefined })
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [form])

  const runAI = async () => {
    const hasKeyword = form.seedKeyword?.trim()
    const hasUrl = form.websiteUrl?.trim()
    if (!hasKeyword && !hasUrl) { setAiError('Enter a seed keyword or website URL first'); return }
    if (hasUrl && !URL_REGEX.test(hasUrl)) { setAiError('Please enter a valid URL'); return }
    const apiKey = storage.getApiKey(provider)
    if (!apiKey) { setAiError(`No API key for ${provider}. Go to Settings.`); return }
    setAiLoading(true); setAiError(null)
    try {
      const userPrompt = `Seed Keyword: ${form.seedKeyword || 'Extract from website'}\nWebsite: ${form.websiteUrl || 'N/A'}\nCountry: ${form.country}\nBusiness Type: ${form.businessType}\n\nGenerate 15-25 keyword ideas covering commercial, informational, long-tail, question, and comparison keywords.\nReturn JSON with keywords array: keyword, intent, relevance (0-100), reason`
      const { raw } = await callAI(AI_SYSTEM_PROMPT, userPrompt, provider)
      const parsed = extractJSON(raw)
      if (parsed.keywords?.length > 0) {
        setKeywords(parsed.keywords.map(k => ({ ...k, opportunity: Math.round(k.relevance * 0.8 + Math.random() * 15), longtail: k.keyword.split(' ').length >= 4, source: 'ai', action: 'copy' })))
      }
    } catch (e) { setAiError(e.message) } finally { setAiLoading(false) }
  }

  const copyKeyword = async (kw, idx) => { if (navigator.clipboard) await navigator.clipboard.writeText(kw); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500) }

  const filteredKeywords = keywords
    .filter(k => filter === 'all' || k.intent?.toLowerCase() === filter)
    .sort((a, b) => sortBy === 'opportunity' ? (b.opportunity || 0) - (a.opportunity || 0) : sortBy === 'relevance' ? (b.relevance || 0) - (a.relevance || 0) : a.keyword.localeCompare(b.keyword))

  const intents = ['all', ...new Set(keywords.map(k => k.intent?.toLowerCase()).filter(Boolean))]
  const intentCounts = keywords.reduce((acc, k) => { const i = k.intent?.toLowerCase() || 'other'; acc[i] = (acc[i] || 0) + 1; return acc }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Keyword Research</h1>
        <p className="text-gray-500 text-sm">Generate keyword ideas and opportunities from seed keywords or your website</p>
      </div>

      <div className={`${cardClass} mb-8`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5"><Search className="w-3.5 h-3.5 inline mr-1" /> Seed Keyword</label>
            <input type="text" value={form.seedKeyword} onChange={e => update('seedKeyword', e.target.value)} onBlur={() => touchField('seedKeyword')} placeholder="e.g. insurance" className={`${inputClass} ${errors.seedKeyword ? 'border-red-400 focus:border-red-500' : ''}`} />
            <FormError message={errors.seedKeyword} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5"><Globe className="w-3.5 h-3.5 inline mr-1" /> Website URL</label>
            <input type="url" value={form.websiteUrl} onChange={e => update('websiteUrl', e.target.value)} onBlur={() => touchField('websiteUrl')} placeholder="https://example.com" className={`${inputClass} ${errors.websiteUrl ? 'border-red-400 focus:border-red-500' : ''}`} />
            <FormError message={errors.websiteUrl} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5"><Globe className="w-3.5 h-3.5 inline mr-1" /> Country</label>
            <select value={form.country} onChange={e => update('country', e.target.value)} className={selectClass}>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5"><Briefcase className="w-3.5 h-3.5 inline mr-1" /> Business Type</label>
            <select value={form.businessType} onChange={e => update('businessType', e.target.value)} className={selectClass}>{BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mt-4">
          <div className="w-full sm:w-48"><ModelSelector value={provider} onChange={setProvider} /></div>
          <button onClick={research} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Researching...' : 'Generate Keywords'}
          </button>
          <button onClick={runAI} disabled={aiLoading} className="px-6 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Wand2 className="w-4 h-4" /> {aiLoading ? 'AI Running...' : 'AI Expand'}
          </button>
        </div>
      </div>

      {error && <ErrorState title="Error" message={error} />}
      {aiError && <ErrorState title="AI Error" message={aiError} />}
      {loading && <LoadingState text="Fetching website and generating keywords..." description="Extracting content, headings, and topics from the website" />}
      {aiLoading && <LoadingState text="AI keyword expansion..." description="Generating AI-powered suggestions" />}

      {siteInfo && !loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Website Analysis</span>
            {siteInfo.fetched ? (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Content fetched</span>
            ) : (
              <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">Could not fetch (CORS blocked)</span>
            )}
          </div>
          {siteInfo.title && <p className="text-xs text-gray-500 mb-1">Title: {siteInfo.title}</p>}
          {siteInfo.headings.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {siteInfo.headings.map((h, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{h}</span>
              ))}
            </div>
          )}
          {!siteInfo.fetched && !form.seedKeyword && (
            <p className="text-xs text-yellow-600 mt-2">Website content couldn't be fetched due to CORS restrictions. Enter a seed keyword for best results, or try the AI Expand button.</p>
          )}
        </div>
      )}

      {keywords.length > 0 && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <ScoreCard label="Total Keywords" value={keywords.length} icon="🔢" small />
            {Object.entries(intentCounts).map(([intent, count]) => (
              <ScoreCard key={intent} label={intent.charAt(0).toUpperCase() + intent.slice(1)} value={count} icon="🎯" small />
            ))}
          </div>

          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button onClick={() => setActiveTab('keywords')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'keywords' ? 'bg-[#0C81F3]/10 text-[#0C81F3]' : 'text-gray-500 hover:text-gray-900'}`}>📊 All Keywords ({keywords.length})</button>
            <button onClick={() => setActiveTab('questions')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'questions' ? 'bg-[#0C81F3]/10 text-[#0C81F3]' : 'text-gray-500 hover:text-gray-900'}`}>❓ Questions ({questions.length})</button>
          </div>

          {activeTab === 'keywords' && (
            <>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                {intents.map(intent => (
                  <button key={intent} onClick={() => setFilter(intent)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === intent ? 'bg-[#0C81F3]/10 text-[#0C81F3] border border-[#0C81F3]/30' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:text-gray-900'}`}>
                    {intent === 'all' ? 'All' : intent.charAt(0).toUpperCase() + intent.slice(1)}
                    {intent !== 'all' && ` (${intentCounts[intent] || 0})`}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:outline-none appearance-none cursor-pointer">
                    <option value="opportunity">Opportunity</option>
                    <option value="relevance">Relevance</option>
                    <option value="keyword">A-Z</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-3 sm:px-4 py-3 text-gray-500 font-medium">Keyword</th>
                        <th className="text-left px-3 sm:px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">Intent</th>
                        <th className="text-center px-3 sm:px-4 py-3 text-gray-500 font-medium">Opp.</th>
                        <th className="text-center px-3 sm:px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Relevance</th>
                        <th className="text-right px-3 sm:px-4 py-3 text-gray-500 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeywords.map((kw, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-4 py-2.5 text-gray-900 font-medium">
                            <span className="block sm:inline">{kw.keyword}</span>
                            <span className="sm:hidden text-xs text-gray-400 block mt-0.5">{kw.intent}</span>
                            {kw.longtail && <span className="ml-2 text-xs bg-[#0C81F3]/10 text-[#0C81F3] px-1.5 py-0.5 rounded hidden sm:inline">long-tail</span>}
                            {kw.source === 'ai' && <span className="ml-2 text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded hidden sm:inline">AI</span>}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 hidden sm:table-cell">
                            <span className={`text-xs px-2 py-1 rounded-full border ${formatKeywordIntent(kw.intent)}`}>{kw.intent}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 text-center">
                            <span className={`text-sm font-bold ${kw.opportunity >= 80 ? 'text-green-600' : kw.opportunity >= 60 ? 'text-yellow-600' : 'text-gray-400'}`}>{kw.opportunity}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 text-center hidden md:table-cell">
                            <span className={`text-sm font-bold ${kw.relevance >= 80 ? 'text-green-600' : kw.relevance >= 60 ? 'text-yellow-600' : 'text-gray-400'}`}>{kw.relevance || '—'}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 text-right">
                            <button onClick={() => copyKeyword(kw.keyword, i)} className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 transition-colors">
                              {copiedIdx === i ? <><Check className="w-3 h-3 text-green-500" /> <span className="hidden sm:inline">Copied</span></> : <><Copy className="w-3 h-3" /> <span className="hidden sm:inline">Copy</span></>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'questions' && (
            <div className={`${cardClass}`}>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Question Keywords</h3>
              <p className="text-xs text-gray-400 mb-4">Estimated — common search question patterns</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-700 flex-1">❓ {q}</span>
                    <button onClick={() => copyKeyword(q, `q-${i}`)} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
                      {copiedIdx === `q-${i}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <ExportButton data={{ keywords: filteredKeywords, questions }} rows={filteredKeywords.map(k => ({ keyword: k.keyword, intent: k.intent, opportunity: k.opportunity, relevance: k.relevance }))} headers={['keyword', 'intent', 'opportunity', 'relevance']} filename="keyword-research" />
          </div>
        </div>
      )}

      {keywords.length === 0 && !loading && !error && !aiLoading && (
        <EmptyState icon="🎯" title="Enter a seed keyword to start" description="Provide a keyword or website URL to generate keyword opportunities" />
      )}
    </div>
  )
}
