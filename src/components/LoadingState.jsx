export default function LoadingState({ text = 'Analyzing...', description = 'This may take a few seconds' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0C81F3] animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">{text}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  )
}
