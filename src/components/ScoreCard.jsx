import { motion } from 'framer-motion'

export default function ScoreCard({ label, value, icon, color = '#0C81F3', trend, small = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-xl ${small ? 'p-3' : 'p-4'} hover:border-gray-300 shadow-sm transition-colors`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center text-lg`}
            style={{ backgroundColor: color + '15', color }}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-500 truncate`}>{label}</p>
          <p className={`${small ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{value}</p>
        </div>
        {trend !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  )
}
