const STORAGE_PREFIX = 'seo_toolkit_'

const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.warn('localStorage write failed:', e)
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },

  getApiKey(provider) {
    return this.get(`api_key_${provider}`, '')
  },

  setApiKey(provider, key) {
    this.set(`api_key_${provider}`, key)
  },

  removeApiKey(provider) {
    this.remove(`api_key_${provider}`)
  },

  getPreferredProvider() {
    return this.get('preferred_provider', 'openrouter')
  },

  setPreferredProvider(provider) {
    this.set('preferred_provider', provider)
  },

  addHistory(type, data) {
    const history = this.get('analysis_history', [])
    history.unshift({
      id: Date.now(),
      type,
      timestamp: new Date().toISOString(),
      ...data,
    })
    if (history.length > 50) history.pop()
    this.set('analysis_history', history)
  },

  getHistory() {
    return this.get('analysis_history', [])
  },

  clearHistory() {
    this.set('analysis_history', [])
  },

  deleteHistoryItem(id) {
    const history = this.getHistory().filter(item => item.id !== id)
    this.set('analysis_history', history)
  },
}

export default storage
