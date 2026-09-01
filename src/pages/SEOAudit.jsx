import { useState, useCallback } from 'react'
import { Globe, Upload, FileText, Wand2, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react'
import { analyzeSEO } from '../services/seo/seoAnalyzer'
import { callAI, extractJSON } from '../services/ai/aiService'
import storage from '../services/storage/localStorage'
import ScoreCircle from '../components/ScoreCircle'
import ScoreCard from '../components/ScoreCard'
import ProgressBar from '../components/ProgressBar'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import ExportButton from '../components/ExportButton'
import ModelSelector from '../components/ModelSelector'

const CATEGORY_LABELS = {
  technical: 'Technical SEO', onpage: 'On-Page SEO', content: 'Content',
  images: 'Images', links: 'Links', structured: 'Structured Data', social: 'Social Metadata',
}

const AI_SYSTEM_PROMPT = `You are an SEO expert. Analyze the website audit data and return ONLY a JSON object:
{
  "score": number (0-100),
  "criticalIssues": string[],
  "warnings": string[],
  "quickWins": string[],
  "recommendations": string[],
  "technicalSummary": string,
  "contentSummary": string
}
Return ONLY valid JSON. No markdown.`

const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none transition-colors"
const cardClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm"

export default function SEOAudit() {
  const [inputMethod, setInputMethod] = useState('url')
  const [url, setUrl] = useState('')
  const [html, setHtml] = useState('')
  const [keyword, setKeyword] = useState('')
  const [provider, setProvider] = useState(storage.getPreferredProvider())
  const [result, setResult] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiError, setAiError] = useState(null)

  const fetchURL = useCallback(async () => {
    if (!url.trim()) { setError('Please enter a URL'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const proxyUrls = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?key=FREE&url=${encodeURIComponent(url)}`,
      ]
      let htmlContent = null
      for (const proxyUrl of proxyUrls) {
        try { const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) }); if (resp.ok) { htmlContent = await resp.text(); break } } catch { continue }
      }
      if (!htmlContent) {
        setError(`Could not fetch "${url}" — the website may block cross-origin requests.\n\nTry: Switch to "Paste HTML" and copy the page source (Ctrl+U)`)
        setLoading(false); return
      }
      const res = analyzeSEO(htmlContent, keyword)
      setResult({ ...res, url })
      storage.addHistory('audit', { title: url, score: res.summary.overallScore })
    } catch (e) { setError(`Failed to analyze: ${e.message}`) } finally { setLoading(false) }
  }, [url, keyword])

  const analyzeHTML = useCallback(() => {
    if (!html.trim()) { setError('Please paste or upload HTML content'); return }
    setLoading(true); setError(null); setResult(null)
    setTimeout(() => {
      try {
        const res = analyzeSEO(html, keyword)
        setResult({ ...res, url: 'Pasted HTML' })
        storage.addHistory('audit', { title: 'HTML Analysis', score: res.summary.overallScore })
      } catch (e) { setError(`Failed to analyze: ${e.message}`) } finally { setLoading(false) }
    }, 200)
  }, [html, keyword])

  const runAI = async () => {
    const apiKey = storage.getApiKey(provider)
    if (!apiKey) { setAiError(`No API key for ${provider}. Go to Settings.`); return }
    if (!result) { setAiError('Run an audit first'); return }
    setAiLoading(true); setAiError(null)
    try {
      const briefChecks = result.checks.slice(0, 25).map(c => `${c.name}: ${c.status} — ${c.message}`).join('\n')
      const userPrompt = `Audit: ${result.url || 'HTML'}\nKeyword: ${keyword || 'N/A'}\nScore: ${result.summary.overallScore}/100\nPassed: ${result.summary.passedChecks}, Warnings: ${result.summary.warningChecks}, Failed: ${result.summary.failedChecks}\n\nChecks:\n${briefChecks}\n\nReturn JSON with: score, criticalIssues[], warnings[], quickWins[], recommendations[], technicalSummary, contentSummary`
      const { raw } = await callAI(AI_SYSTEM_PROMPT, userPrompt, provider)
      setAiResult(extractJSON(raw))
    } catch (e) { setAiError(e.message) } finally { setAiLoading(false) }
  }

  const handleFileUpload = (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setHtml(ev.target.result); reader.readAsText(file) }

  const statusIcon = (status) => {
    if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (status === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />
    if (status === 'fail') return <XCircle className="w-4 h-4 text-red-500" />
    return <Info className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SEO Audit</h1>
        <p className="text-gray-500 text-sm">Analyze any website for technical SEO issues and improvements</p>
      </div>

      <div className={`${cardClass} mb-8`}>
        <div className="flex gap-2 mb-4">
          {[{ id: 'url', icon: <Globe className="w-4 h-4" />, label: 'Fetch URL' }, { id: 'html', icon: <FileText className="w-4 h-4" />, label: 'Paste HTML' }, { id: 'upload', icon: <Upload className="w-4 h-4" />, label: 'Upload File' }].map(tab => (
            <button key={tab.id} onClick={() => setInputMethod(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMethod === tab.id ? 'bg-[#0C81F3]/10 text-[#0C81F3] border border-[#0C81F3]/30' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:text-gray-900'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {inputMethod === 'url' && <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className={inputClass} />}
            {inputMethod === 'html' && <textarea value={html} onChange={e => setHtml(e.target.value)} placeholder="Paste page HTML source here (Ctrl+U in browser)" className={`${inputClass} h-40 font-mono resize-y`} />}
            {inputMethod === 'upload' && (
              <label className="flex flex-col items-center justify-center h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0C81F3] transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload .html file</span>
                <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>
          <div className="space-y-3">
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Target keyword (optional)" className={inputClass} />
            <ModelSelector value={provider} onChange={setProvider} />
            <button onClick={inputMethod === 'url' ? fetchURL : analyzeHTML} disabled={loading}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Auditing...' : 'Run Audit'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorState title="Audit Error" message={error} onRetry={() => { setError(null); inputMethod === 'url' ? fetchURL() : analyzeHTML() }} />}
      {loading && <LoadingState text="Auditing website..." description="Analyzing HTML structure and SEO factors" />}

      {result && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className={`${cardClass}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Audit Results</h2>
                {result.url && <p className="text-sm text-gray-500">{result.url}</p>}
              </div>
              <ExportButton data={result} filename="seo-audit" label="Export" />
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <ScoreCircle score={result.summary.overallScore} size={130} label="Overall Score" />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.categories).map(([cat, score]) => (
                  <div key={cat}><ProgressBar value={score} label={CATEGORY_LABELS[cat] || cat} showValue height={6} /></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <ScoreCard label="Passed" value={result.summary.passedChecks} icon="✅" color="#22c55e" small />
              <ScoreCard label="Warnings" value={result.summary.warningChecks} icon="⚠️" color="#eab308" small />
              <ScoreCard label="Failed" value={result.summary.failedChecks} icon="❌" color="#ef4444" small />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={runAI} disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
              <Wand2 className="w-4 h-4" /> {aiLoading ? 'AI Analyzing...' : 'AI Deep Analysis'}
            </button>
          </div>
          {aiError && <ErrorState title="AI Error" message={aiError} />}
          {aiLoading && <LoadingState text="AI deep analysis..." description="Generating insights" />}

          {aiResult && !aiLoading && (
            <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">AI Generated</span>
              </div>
              {aiResult.criticalIssues?.length > 0 && (<div className="mb-4"><h4 className="text-sm font-medium text-red-600 mb-2">Critical Issues</h4>{aiResult.criticalIssues.map((s, i) => <p key={i} className="text-sm text-gray-700 mb-1">🔴 {s}</p>)}</div>)}
              {aiResult.quickWins?.length > 0 && (<div className="mb-4"><h4 className="text-sm font-medium text-green-600 mb-2">Quick Wins</h4>{aiResult.quickWins.map((s, i) => <p key={i} className="text-sm text-gray-700 mb-1">⚡ {s}</p>)}</div>)}
              {aiResult.recommendations?.length > 0 && (<div className="mb-4"><h4 className="text-sm font-medium text-[#0C81F3] mb-2">Recommendations</h4>{aiResult.recommendations.map((r, i) => <p key={i} className="text-sm text-gray-700 mb-1">→ {r}</p>)}</div>)}
            </div>
          )}

          <div className={`${cardClass}`}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Detailed Checks</h3>
            <div className="space-y-1.5">
              {result.checks.map((check, i) => (
                <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  {statusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{check.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{check.message}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    check.category === 'technical' ? 'bg-blue-50 text-blue-600' :
                    check.category === 'content' ? 'bg-green-50 text-green-600' :
                    check.category === 'images' ? 'bg-yellow-50 text-yellow-600' :
                    check.category === 'links' ? 'bg-purple-50 text-purple-600' :
                    check.category === 'social' ? 'bg-pink-50 text-pink-600' : 'bg-gray-100 text-gray-500'
                  }`}>{CATEGORY_LABELS[check.category] || check.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState icon="🔍" title="Enter a website URL to audit" description="Provide a URL, paste HTML, or upload an HTML file to get started" />
      )}
    </div>
  )
}
