import { AlertTriangle } from 'lucide-react'

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center max-w-md">
        <p className="text-lg font-medium text-gray-900">{title}</p>
        {message && <p className="text-sm text-gray-500 mt-2">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#0C81F3] text-white rounded-lg hover:bg-[#0a6cd4] transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
