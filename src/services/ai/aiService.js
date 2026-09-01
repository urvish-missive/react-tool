import { callGemini } from './gemini'
import { callOpenRouter } from './openrouter'
import storage from '../storage/localStorage'

const PROVIDERS = {
  gemini: { name: 'Google Gemini', call: callGemini },
  openrouter: { name: 'OpenRouter', call: callOpenRouter },
}

export function getAvailableProviders() {
  return Object.entries(PROVIDERS).map(([key, val]) => ({
    id: key,
    name: val.name,
    hasKey: !!storage.getApiKey(key),
  }))
}

export async function callAI(systemPrompt, userPrompt, preferredProvider = null) {
  const provider = preferredProvider || storage.getPreferredProvider()
  const apiKey = storage.getApiKey(provider)

  if (!apiKey) {
    throw new Error(`No API key configured for ${PROVIDERS[provider]?.name || provider}. Go to Settings to add one.`)
  }

  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) throw new Error(`Unknown provider: ${provider}`)

  try {
    const raw = await providerConfig.call(apiKey, systemPrompt, userPrompt)
    return { raw, provider }
  } catch (err) {
    throw new Error(`${providerConfig.name} failed: ${err.message}`)
  }
}

export function extractJSON(text) {
  // Try to find JSON in the response (may have markdown code blocks)
  let cleaned = text.trim()
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '')
  
  // Try parsing directly
  try { return JSON.parse(cleaned) } catch {}
  
  // Find first { or [ to last } or ]
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')
  const start = firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)
    ? firstBrace
    : firstBracket

  if (start >= 0) {
    const openChar = cleaned[start]
    const closeChar = openChar === '{' ? '}' : ']'
    const lastClose = cleaned.lastIndexOf(closeChar)
    if (lastClose > start) {
      try { return JSON.parse(cleaned.slice(start, lastClose + 1)) } catch {}
    }
  }

  throw new Error('Could not extract valid JSON from AI response')
}

export { PROVIDERS }
