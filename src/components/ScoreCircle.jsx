import { motion } from 'framer-motion'

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ScoreCircle({ score = 0, size = 120, label, showValue = true }) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={RADIUS}
            stroke="#e2e8f0" strokeWidth="6" fill="none"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={RADIUS}
            stroke={color} strokeWidth="6" fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ strokeDasharray: CIRCUMFERENCE }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          </div>
        )}
      </div>
      {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
    </div>
  )
}
