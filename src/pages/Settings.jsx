import { useState, useEffect } from 'react'
import { Key, Save, Trash2, TestTube, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react'
import storage from '../services/storage/localStorage'
import { callAI } from '../services/ai/aiService'

export default function Settings() {
  const [provider, setProvider] = useState(storage.getPreferredProvider())
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => { setApiKey(storage.getApiKey(provider)) }, [provider])

  const saveKey = () => { storage.setApiKey(provider, apiKey.trim()); storage.setPreferredProvider(provider); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const removeKey = () => { storage.removeApiKey(provider); setApiKey(''); setSaved(false) }
  const testConnection = async () => {
    if (!apiKey.trim()) return
    setTesting(true); setTestResult(null)
    try { await callAI('Reply with exactly: {"status":"ok"}', 'Test connection', provider); setTestResult({ success: true, message: 'Connection successful!' }) }
    catch (e) { setTestResult({ success: false, message: e.message }) }
    finally { setTesting(false) }
  }
  const clearAllData = () => { if (confirm('Clear all stored data including API keys, history, and preferences?')) { localStorage.clear(); window.location.reload() } }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500 text-sm">Configure your AI provider and API keys</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-yellow-800">Security Notice</p>
          <p className="text-xs text-yellow-600 mt-1">Client-side API keys are visible in the browser. Do not use sensitive production API keys in a public deployment. Keys are stored in your browser's localStorage only.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Provider</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[{ id: 'openrouter', label: 'OpenRouter', desc: 'Gemini 2.5 Flash — versatile, reliable' }, { id: 'gemini', label: 'Google Gemini', desc: 'Direct Google AI API' }].map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${provider === p.id ? 'border-[#0C81F3] bg-[#0C81F3]/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
              <p className="text-sm font-medium text-gray-900">{p.label}</p>
              <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5"><Key className="w-4 h-4 inline mr-1.5" /> API Key</label>
            <div className="relative">
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                placeholder={provider === 'gemini' ? 'AIza...' : 'sk-or-v1-...'}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0C81F3] focus:outline-none transition-colors" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveKey} disabled={!apiKey.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C81F3] text-white rounded-lg text-sm font-medium hover:bg-[#0a6cd4] transition-colors disabled:opacity-50">
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? 'Saved!' : 'Save Key'}
            </button>
            <button onClick={testConnection} disabled={!apiKey.trim() || testing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
              <TestTube className="w-4 h-4" /> {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button onClick={removeKey}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" /> Remove Key
            </button>
          </div>
          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {testResult.message}
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Get your API key from{' '}
            {provider === 'gemini'
              ? <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-[#0C81F3] hover:underline">Google AI Studio</a>
              : <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-[#0C81F3] hover:underline">OpenRouter Keys</a>
            }
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
        <p className="text-sm text-gray-500 mb-4">All data is stored locally in your browser. No data is sent to any server.</p>
        <button onClick={clearAllData}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
          <Trash2 className="w-4 h-4" /> Clear All Data
        </button>
      </div>
    </div>
  )
}
