import { DEEPSEEK_API_KEY } from './aiConfig';
import type { ChatMessage } from './OllamaProvider';

const DEEPSEEK_BASE = 'https://api.deepseek.com';

export const DEEPSEEK_MODELS = ['deepseek-v3', 'deepseek-reasoner'];

/**
 * Stream a response from the DeepSeek API (OpenAI-compatible SSE format).
 * onStart  — called once the HTTP 200 arrives (before first token)
 * onToken  — called for each streamed token
 */
export async function streamDeepSeek(
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  onStart: () => void,
  onToken: (token: string) => void
): Promise<void> {
  const response = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message ?? `HTTP ${response.status}`);
  }

  onStart();

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const token = JSON.parse(jsonStr).choices?.[0]?.delta?.content ?? '';
        if (token) onToken(token);
      } catch { /* skip malformed chunks */ }
    }
  }
}
