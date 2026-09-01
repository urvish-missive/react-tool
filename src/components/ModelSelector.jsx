import { Bot } from 'lucide-react'

export default function ModelSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Provider</label>
      <div className="relative">
        <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 appearance-none cursor-pointer hover:border-gray-300 focus:border-[#0C81F3] focus:outline-none transition-colors"
        >
          <option value="openrouter">OpenRouter — Gemini 2.5 Flash</option>
          <option value="gemini">Google Gemini — Flash</option>
        </select>
      </div>
    </div>
  )
}
