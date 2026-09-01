import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, BarChart3, FileText, Clock, Trash2, ArrowRight, Sparkles, ClipboardCheck } from 'lucide-react'
import storage from '../services/storage/localStorage'
import EmptyState from '../components/EmptyState'

const TOOL_ICONS = {
  content: <FileText className="w-5 h-5" />,
  audit: <BarChart3 className="w-5 h-5" />,
  keyword: <Search className="w-5 h-5" />,
}

const TOOL_COLORS = {
  content: '#0C81F3',
  audit: '#a855f7',
  keyword: '#22c55e',
}

const TOOL_NAMES = {
  content: 'Content Analyzer',
  audit: 'SEO Audit',
  keyword: 'Keyword Research',
}

export default function Dashboard() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory(storage.getHistory())
  }, [])

  const clearHistory = () => {
    storage.clearHistory()
    setHistory([])
  }

  const deleteItem = (id) => {
    storage.deleteHistoryItem(id)
    setHistory(storage.getHistory())
  }

  const tools = [
    { to: '/content-analyzer', icon: '📝', title: 'Content Analyzer', desc: 'Analyze content for SEO optimization, readability, and keyword usage', color: '#0C81F3' },
    { to: '/seo-audit', icon: '🔍', title: 'SEO Audit', desc: 'Audit any website for technical SEO issues and improvements', color: '#a855f7' },
    { to: '/keyword-research', icon: '🎯', title: 'Keyword Research', desc: 'Generate keyword ideas and opportunities from seed keywords', color: '#22c55e' },
    { to: '/content-qa', icon: '✅', title: 'Content QA', desc: 'QA checklist to catch content issues before publish', color: '#f97316' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C81F3]/10 border border-[#0C81F3]/20 text-[#0C81F3] text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered SEO Tools
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          SEO <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">Toolkit</span>
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Professional SEO tools running entirely in your browser. No data leaves your device.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
        {tools.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
          >
            <span className="text-3xl block mb-4">{tool.icon}</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#0C81F3] transition-colors">{tool.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{tool.desc}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: tool.color }}>
              Open Tool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>

      {/* History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Analyses</h2>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No analyses yet"
            description="Start by using one of the tools above"
          />
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: TOOL_COLORS[item.type] + '15', color: TOOL_COLORS[item.type] }}>
                  {TOOL_ICONS[item.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title || item.seedKeyword || item.url || TOOL_NAMES[item.type]}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TOOL_NAMES[item.type]} • {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
