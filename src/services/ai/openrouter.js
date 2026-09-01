async function doOpenRouterRequest(apiKey, systemPrompt, userPrompt, maxTokens = 2048) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))

    // 402 = credit limit exceeded — retry with fewer tokens
    if (response.status === 402 && maxTokens > 512) {
      const reduced = Math.floor(maxTokens / 2)
      console.log(`OpenRouter 402 — retrying with max_tokens: ${reduced}`)
      return doOpenRouterRequest(apiKey, systemPrompt, userPrompt, reduced)
    }

    throw new Error(`OpenRouter API error: ${response.status} ${JSON.stringify(err)}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No text in OpenRouter response')
  return text
}

export async function callOpenRouter(apiKey, systemPrompt, userPrompt) {
  return doOpenRouterRequest(apiKey, systemPrompt, userPrompt, 2048)
}
