import { motion } from 'framer-motion'

export default function ProgressBar({ value = 0, max = 100, color, label, showValue = true, height = 8 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const barColor = color || (pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : pct >= 40 ? '#f97316' : '#ef4444')

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-gray-700">{label}</span>}
          {showValue && <span className="text-sm font-medium text-gray-500">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
