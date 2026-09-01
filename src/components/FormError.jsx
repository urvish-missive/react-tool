import { AlertCircle } from 'lucide-react'

export default function FormError({ message }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      <span className="text-xs text-red-500">{message}</span>
    </div>
  )
}
