export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  const ta = document.createElement('textarea')
  ta.value = text
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${filename}.json`)
}

export function downloadCSV(rows, headers, filename) {
  const csvRows = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const val = typeof row[h] === 'string' ? row[h] : row[h]
      return `"${String(val || '').replace(/"/g, '""')}"`
    }).join(','))
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  downloadBlob(blob, `${filename}.csv`)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printReport() {
  window.print()
}
