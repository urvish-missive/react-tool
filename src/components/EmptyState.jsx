export default function EmptyState({ icon = '📊', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <span className="text-4xl">{icon}</span>
      <div className="text-center max-w-md">
        <p className="text-lg font-medium text-gray-900">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[#0C81F3] text-white rounded-lg hover:bg-[#0a6cd4] transition-colors text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
