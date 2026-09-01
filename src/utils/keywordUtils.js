export function formatKeywordIntent(intent) {
  const colors = {
    Informational: 'bg-blue-50 text-blue-700 border-blue-200',
    Commercial: 'bg-purple-50 text-purple-700 border-purple-200',
    Transactional: 'bg-green-50 text-green-700 border-green-200',
    Navigational: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Comparison: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return colors[intent] || 'bg-gray-50 text-gray-600 border-gray-200'
}

export function getIntentIcon(intent) {
  const icons = {
    Informational: '📚',
    Commercial: '🛒',
    Transactional: '💳',
    Navigational: '🧭',
    Comparison: '⚖️',
  }
  return icons[intent] || '🔍'
}

export function sortKeywords(keywords, sortBy = 'opportunity', direction = 'desc') {
  return [...keywords].sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0
    return direction === 'desc' ? bVal - aVal : aVal - bVal
  })
}
