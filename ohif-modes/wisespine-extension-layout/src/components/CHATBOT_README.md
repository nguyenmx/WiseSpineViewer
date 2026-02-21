# WiseSpine AI Chatbot — Component Documentation

The chatbot is embedded as a tab in the right side panel of the WiseSpine OHIF viewer. It supports multiple AI backends selectable from a single dropdown and can analyse DICOM viewport images alongside text questions.

---

## File Structure

```
src/components/
├── ChatController.tsx     — Main React component: UI, state, model routing
├── OllamaProvider.ts      — Ollama (local) streaming API
├── DeepSeekProvider.ts    — DeepSeek (cloud) streaming API
└── aiConfig.ts            — API keys (gitignored)
```

The chatbot tab is registered in:

```
src/ViewerLayout/WiseSpineLayoutComponent.tsx
```

---

## Components

### `ChatController.tsx`

The top-level controller component rendered inside the OHIF right panel tab. It owns all React state and routes each message to the correct provider.

**Responsibilities**

- Fetches available Ollama models on mount and populates the model selector dropdown
- Falls back to DeepSeek → Gemini if Ollama is unreachable
- Manages all message state (`messages`, `isLoading`, `error`)
- Handles image attachment: captures the DICOM viewport canvas, accepts drag-and-drop of OHIF thumbnails, or accepts image file drops
- Routes the send action to the correct provider (`streamOllama`, `streamDeepSeek`, or inline Gemini streaming)
- Renders the chat bubble UI, model selector, and input textarea

**Model priority on load**

```
Ollama models (if Ollama is running)
  → DeepSeek (deepseek-v3, if DEEPSEEK_API_KEY is set)
    → Gemini (gemini-2.5-flash, if GEMINI_API_KEY is set)
```

**Image attachment support**

| Provider  | Image support | How it works |
|-----------|--------------|--------------|
| Ollama    | Yes (vision models only) | Base64 image sent in Ollama `images` field on last user message |
| Gemini    | Yes          | Base64 image sent as `inline_data` part in Gemini content |
| DeepSeek  | No           | Attach button hidden when a DeepSeek model is selected |

Three ways to attach an image when a supporting model is selected:
1. Click **📎 Attach image** — captures the current DICOM viewport canvas
2. **Drag a thumbnail** from the OHIF left panel into the chat area
3. **Drop an image file** from your filesystem onto the chat area

**Streaming helpers**

| Function | Purpose |
|----------|---------|
| `onStreamStart()` | Called by each provider once the HTTP 200 arrives. Adds the empty assistant bubble and hides the "Thinking…" spinner. |
| `appendToken(token)` | Called by each provider for every streamed token. Appends the token to the last message in state. |

**Gemini streaming** is handled inline inside `ChatController.tsx` because it requires access to image data and the Gemini-specific multi-part content format.

**Key state**

| State | Type | Purpose |
|-------|------|---------|
| `ollamaModels` | `string[]` | List of locally pulled Ollama model names |
| `selectedModel` | `string` | Currently active model identifier |
| `messages` | `Message[]` | Full conversation history |
| `isLoading` | `boolean` | True while waiting for the first token ("Thinking…" state) |
| `attachImage` | `boolean` | Whether an image will be sent with the next message |
| `previewDataUrl` | `string \| null` | The data URL of the image currently staged for sending |

---

### `OllamaProvider.ts`

Handles communication with a locally running [Ollama](https://ollama.com) server.

**Endpoint:** `http://localhost:11434`

**Exports**

#### `ChatMessage` (type)
```ts
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
```
Shared base message type. Imported by `DeepSeekProvider.ts` and `ChatController.tsx`.

#### `fetchOllamaModels(): Promise<string[]>`
Calls `GET /api/tags` and returns the names of all locally pulled models. Used on mount to populate the model dropdown. Returns an empty array if Ollama is unreachable.

#### `streamOllama(model, messages, systemPrompt, onStart, onToken, imageBase64?): Promise<void>`

Streams a chat response from Ollama using newline-delimited JSON (`/api/chat`).

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | `string` | Ollama model name (e.g. `mistral-small3.1`, `llava`) |
| `messages` | `ChatMessage[]` | Conversation history (system prompt is prepended internally) |
| `systemPrompt` | `string` | Injected as the first system message |
| `onStart` | `() => void` | Called once HTTP 200 is received, before first token |
| `onToken` | `(token: string) => void` | Called for each streamed token |
| `imageBase64` | `string \| null` (optional) | Raw base64 image (no `data:…` prefix) attached to the last user message. Only works with vision-capable models. |

**Vision-capable Ollama models (examples)**

| Model | Pull command |
|-------|-------------|
| Mistral Small 3.1 | `ollama pull mistral-small3.1` |
| LLaVA | `ollama pull llava` |
| Moondream | `ollama pull moondream` |
| BakLLaVA | `ollama pull bakllava` |

---

### `DeepSeekProvider.ts`

Handles communication with the [DeepSeek](https://platform.deepseek.com) cloud API using the OpenAI-compatible SSE streaming format.

**Endpoint:** `https://api.deepseek.com/chat/completions`

**Exports**

#### `DEEPSEEK_MODELS: string[]`
```ts
['deepseek-v3', 'deepseek-reasoner']
```
The two models exposed in the dropdown. `deepseek-v3` is DeepSeek-V3 (general chat). `deepseek-reasoner` is DeepSeek-R1 (chain-of-thought reasoning).

#### `streamDeepSeek(model, messages, systemPrompt, onStart, onToken): Promise<void>`

Streams a chat response from the DeepSeek API.

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | `string` | DeepSeek model ID (`deepseek-v3` or `deepseek-reasoner`) |
| `messages` | `ChatMessage[]` | Conversation history |
| `systemPrompt` | `string` | Injected as the first system message |
| `onStart` | `() => void` | Called once HTTP 200 is received |
| `onToken` | `(token: string) => void` | Called for each streamed token |

The API key is read internally from `aiConfig.ts` (`DEEPSEEK_API_KEY`). DeepSeek does not currently support image input; the attach button is hidden when a DeepSeek model is active.

---

### `aiConfig.ts`

Stores API keys. **This file is gitignored and must never be committed.**

```ts
export const GEMINI_API_KEY = 'your-gemini-key';
export const DEEPSEEK_API_KEY = 'your-deepseek-key';
```

If this file is missing or a key is blank, the corresponding provider is hidden from the dropdown.

---

## How the Chatbot Tab Is Registered

In `WiseSpineLayoutComponent.tsx`, the chatbot is injected directly into the right `SidePanel` tab list at the layout level — bypassing the OHIF extension/panel service. This means it is always present regardless of which OHIF mode or hanging protocol is active.

```ts
const CHAT_TAB = {
  id: 'aiChat',
  label: 'AI Chat',
  iconName: 'TabChatBubble',
  content: ChatController,
};

// Merged into rightTabs on every render:
useState([...panelService.getPanels('right'), CHAT_TAB]);
```

---

## Adding a New Provider

1. Create `src/components/YourProvider.ts`
2. Export a `streamYourProvider(model, messages, systemPrompt, onStart, onToken)` function following the same `onStart` / `onToken` callback signature used by `OllamaProvider` and `DeepSeekProvider`
3. Add the model names to the dropdown `<optgroup>` in `ChatController.tsx`
4. Add a detection flag (e.g. `const isYours = selectedModel.startsWith('your-prefix-')`) and a routing branch in `handleSend`
5. Add the API key to `aiConfig.ts`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift + Enter` | Insert newline |

Hotkeys for the OHIF viewer are automatically disabled while the chat panel is focused and re-enabled when the viewport is clicked.
