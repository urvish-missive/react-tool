import { useState, useRef, useEffect } from 'react'
import { Download, Copy, FileJson, FileText, Printer, ChevronDown } from 'lucide-react'
import { copyToClipboard, downloadJSON, downloadCSV, printReport } from '../utils/exportUtils'

export default function ExportButton({ data, headers, rows, filename = 'export', label = 'Export' }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCopy = async () => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const items = [
    { icon: <Copy className="w-4 h-4" />, label: copied ? 'Copied!' : 'Copy to Clipboard', onClick: handleCopy },
    { icon: <FileJson className="w-4 h-4" />, label: 'Download JSON', onClick: () => { downloadJSON(data, filename); setOpen(false) } },
    ...(rows ? [{ icon: <FileText className="w-4 h-4" />, label: 'Download CSV', onClick: () => { downloadCSV(rows, headers, filename); setOpen(false) } }] : []),
    { icon: <Printer className="w-4 h-4" />, label: 'Print Report', onClick: () => { printReport(); setOpen(false) } },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
